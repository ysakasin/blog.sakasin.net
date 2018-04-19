---
layout: post
title: Umiを作ってUmiに移行した話
date: 2015-12-15 12:35:47 +0900
slug: making-bootstrap-umi
description: Umiは、日本語も美しく表示できるBootstrapテーマであるHonokaのフォークテーマです。このテーマは私が運営しているサイトをHonoka移行したいという目的を持って作成しました。このWebサイトも2015/12/15現在はUmiを使っています。
---
このエントリーは [Bootstrap Advent Calendar 2015](http://qiita.com/advent-calendar/2015/bootstrap) 15日目のエントリーです。

[Umi](https://ysakasin.github.io/Umi/)は、日本語も美しく表示できるBootstrapテーマである[Honoka](http://honokak.osaka/)のフォークテーマです。このテーマは私が運営しているサイトをHonoka移行したいという目的を持って作成しました。このWebサイトも2015/12/15現在はUmiを使っています。

Honokaの紹介はAdvent Calenderの他の記事やHonokaプロダクトサイトに任せるとします。

このエントリーでは、Umiの作成経緯から移行・メンテナンスをまとめたいと思います。


## Honoka forkを作りたくなった

Honokaが世に出た時、自分は[Proconist.net](https://proconist.net)という[高専プロコン](http://www.procon.gr.jp/)向けのWebサイトを立ち上げた直後でした。このサイトは、Honoka作者の[Takuto Kanzaki](http://windyakin.net/)さんに全面的に関わっていただいていて、[Bootswatch Flatly](http://bootswatch.com/)をCSSフレームワークとして使っていました。

「うちのサイトにもHonokaを使いたいなぁ」

「Honokaはオープンソース」

「Bootswatchもオープンソース」

そんなことを思いつつ、HonokaのリポジトリにStarがつきまくっているそんな時、Twitterで

<blockquote class="twitter-tweet" lang="ja"><p lang="ja" dir="ltr"><a href="https://twitter.com/NKMR6194">@NKMR6194</a> 別キャラの名前とかにしちゃいましょう()</p>&mdash; じゅりあん (@MITLicense) <a href="https://twitter.com/MITLicense/status/603057452804755458">2015, 5月 26</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

「……これは？！」

ﾎﾉｶﾁｬﾝ！⊂(・８・)⊃
ｳﾐﾁｬﾝ！⊂(・８・)⊃

という神（作者）からの天啓を受けて、Bootswatch Flatlyで主に使われている **深い紺色からイメージ** し、 **Umi** という名前のHonokaフォークを作ることにしました。


## Umiを作る

### 配色を変える

Umiを作るのは簡単です。Bootstrapにおいて、配色は`scss/_variables.scss`に書かれた以下の要素を使って表されています。基本的にそれらの値をBootswatch Flatlyから引っ張ってきて、Honokaに上書きするだけです。

{% highlight plain %}
$gray-base
$gray-darker
$gray-dark
$gray
$gray-light
$gray-lighter

$brand-primary
$brand-success
$brand-info
$brand-warning
$brand-danger
{% endhighlight %}

しかし、これだけだとNavbar周りの配色がうまくいきません。そこで、`$navbar-default-color`や`$navbar-inverse-color`といった値をBootswatch Flatlyの設定で上書きしています。

### ページを変える

HonokaのプロダクトサイトはGitHubリポジトリ上で公開/管理されています。それなら、forkしたテーマもGitHub Pagesでプロダクトサイトを作るのが道理というものです。

先ほど配色を変えたCSSを使っているので、やることはほとんどありません。やることといえば、この３つくらいです。

* 表記をUmiにする
* Honokaのforkテーマであることを明記する
* 海未ちゃんの画像を用意する


## Umiへの移行

満を持してUmiを公開したのち、目的であったProconist.netのUmi移行を行いました。

### 移行手順

**UmiのCSSを読み込む** <small>おわり</small>

本当にそれだけです。UmiやHonokaはBootstrapのフォークテーマであり互換性が非常に高いので本当にこれだけです。[コミットログ](https://github.com/ysakasin/proconist.net/commit/3616120019c70aa6c5331ccb8512d1a0db219c68)もそれを示してくれています。


## Umiをメンテナンスする

自分のために作ったとはいえUmiはOSSです。せっかく公開したのだから誰かに長く使ってもらいたいですし、HonokaをforkしたテーマとしてはHonokaの恥にならないようにしたいです。そこで、HonokaがバージョンアップするたびにUmiも追随してバージョンアップするようにしています。

作業は**Honokaのmasterをマージする**。これだけです。

UmiはGitHub上でHonokaをforkしたリポジトリ上で開発しているため、Honokaのブランチの１つとして存在しています。よって、Honokaのmasterをマージすれば変更を取り込むことができるというわけです。しかし、コンフリクトが大量に発生します。こればかりは仕方がないので、該当箇所を手動で修正してマージします。現在リリースされている`Umi v3.3.6-1`までに、少なくとも４回はマージ作業を行いました。自分としてはマージ作業でGit力がモリモリ上がって、今ではコンフリクトとは友達のような気分です。

これらの作業をすることで、`Umi v3.3.6-1`ではHonokaと同様に[Bower](http://bower.io/)に対応することができました。


## まとめ

* Honoka forkを作るのは **かんたん**
* UmiやHonokaに移行するのは **かんたん**
* メンテナンスしてコンフリクトと **ともだち**

まとめも済んだので、この場を借りて謝辞を。

Honokaという素晴らしいプロダクトを作ってくださり、HonokaプロダクトページにUmiを掲載してくださったTakuto Kanzakiさんに感謝いたします。Proconist.netの作成を一緒に頑張ってくれてたうえに、このような素晴らしい人を紹介してくれた [@raryosu](https://twitter.com/raryosu) にもね！

これからもUmiのメンテナンスを続けつつ、Honokaの開発に積極参加していきます。応援よろしくお願いします！

私からは以上となります。あと数日間、[Bootstrap Advent Calendar 2015](http://qiita.com/advent-calendar/2015/bootstrap)を是非楽しんでください。

## P.S.

Honoka, Umi, [Nico](http://kubosho.github.io/Nico/)に続くテーマを作るのはあなただ！！！
