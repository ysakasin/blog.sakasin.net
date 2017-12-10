---
layout: post
title: なぜpthread_mutexは機能するのか？
date: 2017-12-10 14:00:00 +0900
slug: pthread-mutex-with-glibc
description: なぜpthread mutexで排他処理ができるのか。その謎を明らかにすべく我々はglibcの奥地へと向かった。
---

このエントリーは [#kosen10s Advent Calendar 2017](http://www.adventar.org/calendars/2199) 10日目のエントリーです。前日の担当はさつまで、[共分散行列適応進化戦略(CMA-ES)と自然勾配法](http://satuma-portfolio.hateblo.jp/entry/2017/12/09/025009)というエントリーでした。

では本題。

私は研究領域の都合上、マルチスレッドを扱っており、C/C++で自前のmutexまがいなことをしなければならないことが多々ある。
自前でやらなきゃいけないのは、往々にしてpthread_mutexの類で実現できないことがあるからだ。

しかし、一般的には自前で排他/同期制御をすることは重大なバグの温床となってしまう。
とはいえ、pthread_mutexだって人が作ったものだから、理解さえすれば、自前で正しい排他制御をできるはず。
本エントリでは自前の排他制御をどう実現するかというのを念頭において、pthread_mutexがどうして排他制御をできるのか、glibcを覗きながら理解を深めてゆく。

> __*なぜpthread_mutexで排他処理ができるのか？*__  
> __*その謎を明らかにすべく我々はglibcの奥地へと向かった。*__


## mutexとは？

排他制御 (mutex) は手続き型言語でマルチスレッドプログラミングをするにおいて、欠かすことのできない事柄の一つだ。
mutexが必要な典型的な例は、複数スレッドで同じ変数に対して読み書きを行う場合である。
変数を読み書きしたいスレッドは、そのための**"権利"**を獲得する。ある"権利"を獲得できるのは１スレッドしかいない。"権利"が必要な区間が終わったら、それを手放す。こうすることで皆が同時に読み書きをして不都合な状態にならないようにする。

重なってはいけない区間に種類がいくつかある時には、それぞれに対して"権利"を作る。こうすることで、不必要な権利の取り合いを防いで、並列性を保つ。また、"権利"が必要な区間を**クリティカルセクション**と言ったりする。

C++でmutexを使った具体例を挙げる。
これは、預金`balance`に対して振り込み`worker1()`と引き落とし`worker2()`が同時に起こるようなコードになっている。

```cpp
#include <mutex>
int blance = 50000;
mutex mtx;

void worker1() {
  mtx.lock();
  balance = balance + 1000;
  mtx.unlock();
}

void worker2() {
  mtx.lock();
  balance = balance - 10000;
  mtx.unlock();
}

int main() {
  // 省略
}
```

わかるとは思うが、`mtx`が`balance`に対するアクセスへの"権利"になっている。
"権利"を獲得する時には`lock()`、手放す時には`unlock()`をする。"権利"は誰か１人しか得られないので、`lock()`を実行すると"権利"が得られるまで待つ。
こうすると、`balance()`へのアクセスは同時に発生しないことが保証できる。


## 実装するにあたっての問題点

実装するにあたって、もうちょっと簡単な例で考えてみる。
別のスレッドがunlockしたというのを検知してlockを獲得を試みるというのは、ある種の同期とみなすことができる。

下記のプログラムは`worker()`の処理が終わったら`done`フラグを立てて、それを`watcher()`が監視しているというものだ。`watcher()`は`worker()`の終了に対して同期する。
このコードにはいくつかの問題がある。

```cpp
int x = 0;
bool done = false;

void worker() {
  // do something
  x = 100;

  done = true;
}

void watcher() {
  while (done != true) {
    // busy wait
  }
  std::cout << x << srd::endl; // 100が期待される
  std::cout << "Done" << srd::endl;
}
```


### 1. コンパイラによる最適化

`watcher()`は`done`をbusy waitして監視している。`watcher()`自身はもちろん`done`を変更しない。このような時にコンパイラはwhileで回っている間に`done`が変わることがないことを検知して、`done`を１回レジスタに入れてそれを使いまわしたり、さらには無限ループを生成したりという最適化を行う。つまり、毎回メモリを読みに行くということをしなくなって、workerによるフラグの変更を検知できない可能性がある。

mutexに例え直すと、unlockされているのに、他のスレッドがいつまでたってもそれを検知できず永遠にlockを獲得できなくなっている。

コンパイラは他のスレッドから値が変更されるかもしれないことはケアしてくれない。


### 2. メモリ・オーダリング

CPUは高速化のため、プログラムの実行時に命令の順番を入れ替えたりする。これをアウト・オブ・オーダー実行という。また、命令の順序付けのことをメモリ・オーダリングと言う。命令の入れ替えも逐次プログラムにおいて問題がないようにはしてくれるのだが、マルチスレッドのことは加味してくれない。

例えば、`worker()`の実行時に、`done = true;`の後に`x = 100;`を実行した方が良いとCPUが判断したとする。前述したコンパイラの問題が起きず、`watcher()`で`done`のbusy waitから抜けられたとしても、フラグを変えた後にxの代入をしているかもしれないから、`x`の値は初期値の0が読めてしまうかもしれない。

mutexに例え直すと、lockを獲得したのに前回のlockで起こった変更を観測できていない。

CPUはマルチスレッドのことを都合よくケアしてくれない。


## pthread_mutexの中へ

単純には実装できないことがこれまでで分かったと思う。ここからはpthread_mutexをみて、肝心なところがどうなっているのかを探って行く。
pthreadとはスレッドに関するPOSIX標準である。
これまでにいくつかC++におけるmutexの例を見てきたが、あれらはpthread_mutexを用いて実装されている。
pthreadにはいくつかの実装があるが、今回は最もポピュラーだと思われるglibcの実装を見ることにする。
下記URLはGitHubに置いたミラーリポジトリだ。

[https://github.com/NKMR6194/glibc](https://github.com/NKMR6194/glibc)

pthreadの実装は [/nptl](https://github.com/NKMR6194/glibc/tree/master/nptl) の `pthread_*.c` にされている。今回はpthread_mutexを知りたいので、 [/ntpl/pthread_mutex_lock.c](https://github.com/NKMR6194/glibc/blob/master/nptl/pthread_mutex_lock.c)を読んでみる。


### 1. \__pthread_mutex_lock

[nptl/pthread_mutex_lock.c#L63][def-mutex-lock]

```c
int
__pthread_mutex_lock (pthread_mutex_t *mutex)
{
  unsigned int type = PTHREAD_MUTEX_TYPE_ELISION (mutex);

  LIBC_PROBE (mutex_entry, 1, mutex);

  if (__builtin_expect (type & ~(PTHREAD_MUTEX_KIND_MASK_NP
         | PTHREAD_MUTEX_ELISION_FLAGS_NP), 0))
    return __pthread_mutex_lock_full (mutex);

  if (__glibc_likely (type == PTHREAD_MUTEX_TIMED_NP))
    {
      FORCE_ELISION (mutex, goto elision);
    simple:
      /* Normal mutex.  */
      LLL_MUTEX_LOCK (mutex); /* ここ */
      assert (mutex->__data.__owner == 0);
    }
  /* 以下省略 */
```

関数の引数にある`pthread_mutex_t`という構造体はpthread_mutexにおいて"権利"を示すものだ。
この関数ではさらに`LLL_MUTEX_LOCK()`というのを呼んでlockを獲得している。


### 2. LLL_MUTEX_LOCK

[nptl/pthread_mutex_lock.c#L42][def-lll-mutex-lock]

```
# define LLL_MUTEX_LOCK(mutex) \
  lll_lock ((mutex)->__data.__lock, PTHREAD_MUTEX_PSHARED (mutex))
```

`lll_lock()` へのラップになっている。


### 3. lll_lock

ここからアーキテクチャ依存なコードが出てきたので、対象は身近なx86_64とする。

[sysdeps/unix/sysv/linux/x86_64/lowlevellock.h#L108][def-lll-lock]

```
#define lll_lock(futex, private) \
  (void)                                                                      \
    ({ int ignore1, ignore2, ignore3;                                         \
       if (__builtin_constant_p (private) && (private) == LLL_PRIVATE)        \
         __asm __volatile (__lll_lock_asm_start                               \
                           "1:\tlea %2, %%" RDI_LP "\n"                       \
                           "2:\tsub $128, %%" RSP_LP "\n"                     \
                           ".cfi_adjust_cfa_offset 128\n"                     \
                           "3:\tcallq __lll_lock_wait_private\n"              \
                           "4:\tadd $128, %%" RSP_LP "\n"                     \
                           ".cfi_adjust_cfa_offset -128\n"                    \
                           "24:"                                              \
                           : "=S" (ignore1), "=&D" (ignore2), "=m" (futex),   \
                             "=a" (ignore3)                                   \
                           : "0" (1), "m" (futex), "3" (0)                    \
                           : "cx", "r11", "cc", "memory");                    \
// 省略
```

よくわからない変態的なことがされているが、`__lll_lock_wait_private()`を呼んでいることはわかる。


### 4. \__lll_lock_wait_private

[nptl/lowlevellock.c#L27][def-lll-lock-wait]

```c
void
__lll_lock_wait_private (int *futex)
{
  if (*futex == 2)
    lll_futex_wait (futex, 2, LLL_PRIVATE); /* Wait if *futex == 2.  */

  while (atomic_exchange_acq (futex, 2) != 0)
    lll_futex_wait (futex, 2, LLL_PRIVATE); /* Wait if *futex == 2.  */
}
```

`*futex == 2`の時がロックされている状態で、その場合は`lll_futex_wait()`で待っている。
`atomic_exchange_acq()`でロックの獲得を試みている。


### 5. atomic_exchange_acq

[sysdeps/x86_64/atomic-machine.h#L118][def-exchange]

```
#define atomic_exchange_acq(mem, newvalue) \
  ({ __typeof (*mem) result;                                                  \
     if (sizeof (*mem) == 1)                                                  \
       __asm __volatile ("xchgb %b0, %1"                                      \
                         : "=q" (result), "=m" (*mem)                         \
                         : "0" (newvalue), "m" (*mem));                       \
     else if (sizeof (*mem) == 2)                                             \
       __asm __volatile ("xchgw %w0, %1"                                      \
                         : "=r" (result), "=m" (*mem)                         \
                         : "0" (newvalue), "m" (*mem));                       \
     else if (sizeof (*mem) == 4)                                             \
       __asm __volatile ("xchgl %0, %1"                                       \
                         : "=r" (result), "=m" (*mem)                         \
                         : "0" (newvalue), "m" (*mem));                       \
     else                                                                     \
       __asm __volatile ("xchgq %q0, %1"                                      \
                         : "=r" (result), "=m" (*mem)                         \
                         : "0" ((atomic64_t) cast_to_integer (newvalue)),     \
                           "m" (*mem));                                       \
     result; })
```

どうやら、最終的にはx86の命令`xchg`に落ちるようだ。

まず、コンパイラによる過度な最適化の問題に対して、**glibcはインラインアセンブラを利用することで解決している**ということがわかった。

[def-mutex-lock]:https://github.com/NKMR6194/glibc/blob/master/nptl/pthread_mutex_lock.c#L63
[detail-mutex-lock]:https://github.com/NKMR6194/glibc/blob/master/nptl/pthread_mutex_lock.c#L78
[def-lll-mutex-lock]:https://github.com/NKMR6194/glibc/blob/master/nptl/pthread_mutex_lock.c#L42
[def-lll-lock]:https://github.com/NKMR6194/glibc/blob/95ccb619f553c130dde7b51098d69132547f8a90/sysdeps/unix/sysv/linux/x86_64/lowlevellock.h#L108
[def-lll-lock-wait]:https://github.com/NKMR6194/glibc/blob/95ccb619f553c130dde7b51098d69132547f8a90/nptl/lowlevellock.c#L27
[def-exchange]:https://github.com/NKMR6194/glibc/blob/95ccb619f553c130dde7b51098d69132547f8a90/sysdeps/x86_64/atomic-machine.h#L118


## xchg

まだメモリ・オーダリングへの対処について疑問が残るため、この命令について詳しく調べてみる。

xchgはレジスタとメモリの値をアトミックに交換するような操作だ。ここでいうアトミックというのは、中間状態が生まれないような操作のことを指す。複数のスレッドが同時に触っても変な交換がされないようになっていて、順番に交換の操作を行った時と同じ結果を各スレッドが得る。

pthread_mutexにおいて、lockを試みる時には、レジスタをlock済みの状態を表す値にしておいてxchgを発行する。交換されてきた値がさっきの値と変わっていれば自身がlockを獲得したということがわかるという寸法だ。すでに誰かにlockされている時には、レジスタとメモリ中の値が同じ状態で交換されるので、帰ってきた値が変わっていなければlock獲得できなかったということがわかる。

[Wikibooks][xchg-wikibooks]や[有志の解説ページ][xchg-tips]を見ると、xchgは`LOCK`プリフィックスが暗黙のうちに指定されるという。

[cas-wiki]:https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%B3%E3%83%9A%E3%82%A2%E3%83%BB%E3%82%A2%E3%83%B3%E3%83%89%E3%83%BB%E3%82%B9%E3%83%AF%E3%83%83%E3%83%97
[xchg-wikibooks]:https://ja.wikibooks.org/wiki/X86%E3%82%A2%E3%82%BB%E3%83%B3%E3%83%96%E3%83%A9/%E3%83%87%E3%83%BC%E3%82%BF%E8%BB%A2%E9%80%81%E5%91%BD%E4%BB%A4#%E3%83%87%E3%83%BC%E3%82%BF%E4%BA%A4%E6%8F%9B
[xchg-tips]:http://softwaretechnique.jp/OS_Development/Tips/IA32_Instructions/XCHG.html


## LOCKプリフィックス

これがなんなのかさらに詳しく知るために、[有志の解説ページ][xchg-tips]の指示にしたがって「IA-32 インテル® アーキテクチャ・ソフトウェア・デベロッパーズ・マニュアル」下巻の7章を参照してみる。

[IA-32 インテル® アーキテクチャ・ソフトウェア・デベロッパーズ・マニュアル 下巻][intel-dev]（約10MBのpdf)

7.2章 (p.263) のタイトルが「メモリ・オーダリング」となっていていかにも怪しい。
この章の１段落目を以下に引用する。
実行時最適化の問題を解決したような状態はストロング・オーダリングと言われていることがわかる。

> メモリ・オーダリングとは、プロセッサがシステムメモリへのシステムバスを介して読み取り（ロード）および書き込み（ストア）命令を発行する順序である。
> IA-32アーキテクチャでは、プロセッサによって、いくつかのメモリ・オーダリング・モデルをサポートしている。
> 例えば、Intel386™プロセッサではプログラム・オーダリング（通常、**ストロング・オーダリング**と呼ばれる）を使用しており、すべての状況において、命令ストリームでの順序でシステムバス上に読み取りおよび書き込みが発行される。

さらに先を見て行くと7.2.4章 (p.267) に以下のような記述がある。

> I/O 命令、ロックする命令、LOCK プリフィックス、シリアル化命令はプロセッサ
にストロング・オーダリングを強制する。

つまり、**xchgを使った時点でストロング・オーダリングが強制**され、メモリ・オーダリングの問題は解決しているということがわかった。

[intel-dev]:https://www.intel.co.jp/content/dam/www/public/ijkk/jp/ja/documents/developer/IA32_Arh_Dev_Man_Vol3_i.pdf


## 自前の実装を考える

基本的には今まで見てきたpthread_mutexのやり方を踏襲するのが良いと思われる。
しかし、インラインアセンブラを書くのはコストが重すぎるので、別のものを使いたい。

そこで`__atomic`から始まるgccのビルトイン関数群を使うのがいいだろう。

[atomic Builtins - GCC, the GNU Compiler Collection - GNU.org](https://gcc.gnu.org/onlinedocs/gcc/_005f_005fatomic-Builtins.html)

gccには`__atomic_exchange()`や`__atomic_exchange_n()`というのが用意されていて、これはアトミックにメモリの内容を交換してくれる。
今回のエントリではunlock時の処理には触れなかったが、unlock時には`__atomic_store()`を用いてunlock状態に変更すれば大丈夫だろう。
これらのatomic関数はメモリから読むこと機能なので、コンパイラの最適化による問題も発生しない。

ただし、コンパイル時の命令オーダリングについて問題が残るので、`__atomic_*()`を呼び出す際に第２引数でメモリモデルを指定する必要があると思われる。
`__ATOMIC_SEQ_CST`が順序関係を厳しく保つメモリモデルなので、これを指定しておけば問題ない。

これらを踏まえて自前のmutexを単純に書いてみると、以下のようになる。

```cpp
class my_mutex {
private:
  static const int locked = 1;
  static const int available = 0;

  int state = available;

public:
  void lock() {
    while (__atomic_exchange_n(&state, locked, __ATOMIC_SEQ_CST) == locked) {
      // busy wait
    }
  }

  void unlock() {
    __atomic_store_n(&state, available, __ATOMIC_SEQ_CST);
  }
};
```


## まとめ

glibcにおけるpthread_mutexの実装ではインラインアセンブラでxchgを書くことで諸々の問題を解決していることがわかった。
そして、自前でmutexの機構を実装する際には、xchgと同じ動作をするビルトイン関数`__atomic_exchange()`を用いるのが良いと思われる。

この記事は色々と調べながら書いたものではあるが、理論的・技術的な間違いがふくまれている可能性が多分にある。
間違いを見つけたら、私になんらかの方法で指摘をいただけるとありがたい。

[明日12/11](https://adventar.org/calendars/2199#list-2017-12-11)は、さんだーくんの担当です。





