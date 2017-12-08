---
layout: post
title: Markdownで書くレポートのすゝめ
date: 2015-12-10 00:00:00 +0900
slug: write-a-report-with-markdown
description: 私はつくばに来てからMarkdownでレポートを書くようになりました。日々の授業の課題や実験レポートなど、ややカジュアルなレポートではとても有用だと思うので、しくみや導入方法を紹介していきます。
---
このエントリーは [coins Advent Calendar 2015](http://www.adventar.org/calendars/1211) 10日目の記事です。本日は、coins13 三編の酒田　シンジがおおくりいたします。

みなさんはレポートをどんな方法で書いていますか？ Wordで書く、TeXで書くなどいろいろ方法がありますよね。

私はつくばに来てからMarkdownでレポートを書くようになりました。日々の授業の課題や実験レポートなど、ややカジュアルなレポートではとても有用だと思うので、しくみや導入方法を紹介していきます。


## しくみ

基本のしくみとしては、書いたMarkdownをPDFに変換してレポートにしています。そのために以下の２つのソフトウェアを利用しています。

* [Pandoc](http://pandoc.org/)
* [LuaLaTeX](http://www.luatex.org/) [[TeX Wiki](https://oku.edu.mie-u.ac.jp/~okumura/texwiki/?LuaTeX)]

すまない。結局TeXなんだ。

### Pandoc

こいつはいろんなマークアップ言語の文書を読み込んで、その他のマークアップ言語に書き直すという機能を持っています。PandocにMarkdownで書いたレポートをTeXに変換することでPDF化にこぎつけています。

LuaLaTeXの呼び出しなどもPandocがやってくれます。

### LuaLaTeX

いろんなディストリビューションがあるTeXですが、LuaLaTeXだとUnicodeに完全対応しています。パッケージLuaTeX-jaを使うことで、簡単に日本語文書の組版ができるようになります。

pLaTeXなどでも日本語には対応していますが、LuaLaTeXは直接pdfを出力してくれます。dviなどの中間ファイルを挟まないので、普通にTeXで書きたくなった場合でも大変便利です。


## 導入

OSXでの導入方法を紹介します。

参考にしたサイトがあるので、リンクを貼っておきます。  
[MarkdownからWordやPDF生成ができるようにする (またはPandoc環境の構築方法)](http://k1low.hatenablog.com/entry/2014/02/16/205839)

### Pandoc

brewを使ってインストールします。

{% highlight sh %}
sudo brew install pandoc
{% endhighlight %}

PandocはHaskell製なので、brewがどうしても嫌いな方でもcabalを使うことでインストールできます。cabalの環境を整えれば、以下のコマンドでもインストールできます。

{% highlight sh %}
cabal install pandoc
{% endhighlight %}

### LuaLaTeX

OSXでTeXをインストールするのに便利なMacTeXから、最小構成の[BasicTeX](http://www.tug.org/mactex/morepackages.html)をインストールします。

その後に`tlmgr`を使って日中漢の言語パッケージを導入します。詳しくは上記の[参考サイト](http://k1low.hatenablog.com/entry/2014/02/16/205839)を確認してください。


## 使う

`report.md`を`report.pdf`というPDFに変換するときはコマンドライン上から以下のように実行します。

{% highlight sh %}
pandoc report.md -o report.pdf -V documentclass=ltjsarticle --latex-engine=lualatex
{% endhighlight %}

これを毎回入力するのは面倒くさいので、私はシェル関数を書いて省略しています。

<script src="https://gist.github.com/NKMR6194/b02c8cc80f8c424c27ee.js"></script>

`.bachrc`などに追記してやるといい感じになります。ファイルの拡張子は固定なので事前に関数内に書いてしまっているのと、無用な上書き防止のために出力ファイル名をその都度指定するようにしています。これを適用すれば、以下のようにしてPDFを生成することができます。

{% highlight sh %}
mdtopdf report report
{% endhighlight %}

おつかれさまです！　これでMarkdownをPDFにできるようになりました！！

## 利点

### バージョン管理ができる

Gitで管理できます！ 私はちょっとした講義ノートやメモをGitHubで管理しているので、レポートもバージョン管理ができるのが良いと思っています。Wordなどのファイルをクラウドにあげたりローカルにダウンロードしたりで管理していると、最新版がどれだかわからなくなるので嬉しいです。

### 覚えることが少ない

Markdownなので、TeXに比べると覚えることが格段に少ないと思います。使うものといえば、見出し・リストくらいだと思います。

### TeXの数式でかける

最後はTeXで組版をしているので、TeXの数式を書けばTeXの処理をして数式が表示されます。Wordだと数式エディタがGUI操作だったりして面倒ですが、これならストレス低く書けます。

### シンタックスハイライトをしてくれる

[GitHub Markdownと同じ方法でコードを記述](https://help.github.com/articles/github-flavored-markdown/#fenced-code-blocks)すると、なんとシンタックスハイライトをしてくれます。PandocとLuaLaTeXどちらの機能かはわからないのですが、地味に色がついて見やすくなります。


## 欠点

### 改行が面倒くさい

Markdownではパラグラフ内の改行は行末に空白を２つ入れる必要があります。これが地味に面倒臭いです。PDFを生成してから気づくこともしばしばあります。しかし、毎回パラグラフを分けてしまうと、それはそれで見栄えが悪くなってしまうので避けれれないでいます。

### 環境が限定される

Wordであればcoinsのマシンにも入っていますし、色々な場所でPDFにすることができます。Markdownだと編集はでこでも可能ですが、PDF化できる環境が限られてしまいます。


## まとめ

つくばに来る前はMS Word常用者で、高専の実験レポートは全てWord、卒論もWordで書いたほどでした。Markdownに切り替えてからはエディタのダウンを恐れることも、文書の最新版を探す必要もなくなり、非常にストレスフリーに文書作成ができるようになりました。ぜひ、Markdownでレポート書く環境を一度整えてみてはいかがでしょうか？

