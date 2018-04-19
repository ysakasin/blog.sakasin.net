---
layout: post
title: Buttonを縦横に画面いっぱい敷き詰める方法[Android]
date: 2013-10-26 23:57:00 +0900
slug: android-layout
description: Androidアプリ開発をはじめたので、個人的なTipsを随時載せてい行こうと思います。第１号はボタンを敷き詰める方法。応用すればほかのオブジェクトでも可能かと思います。
---
Androidアプリ開発をはじめたので、個人的なTipsを随時載せてい行こうと思います。第１号はボタンを敷き詰める方法。応用すればほかのオブジェクトでも可能かと思います。

## 目的

* xmlをいじってAndroid端末の画面いっぱいにN×Nだけボタンを並べる。

## 肝

* LinearLayoutをverticalとhorizontalで入れ子にする。
* android:layout_weightを使う。


## 解説

まず、具体的に例を示します。以下のxmlコードは２×３のボタンを画面いっぱいに並べる場合です。
画像は、それをeclipce環境下のグラフィカルレイアウトで仮想的に並べた様子です。

<script src="https://gist.github.com/ysakasin/cefade2e7936fedcf8fb.js"></script>

![Android_Button_Sample](/uploads/Android_Button_Sample.png)

このような書き方だと、画面サイズによらず、決まった数を画面いっぱい格子状に並べることができます。


まず重要なのはverticalとhorizontalの入れ子構造になっていることです。
horizontalを利用して、横にボタンを均等にならべそれをひと括りのLinearLayoutと考えます（仮にＡと名付ける）。さらに、そのＡをverticalで並べるといった考えです。


次に、`android:layout_weight`を使うことです。
LinearLayoutの子要素（今回はButton）のプロパティとして`android:layout_weight`を使うと、LinearLayout内での、子の横幅に重みが付けられます。

今回の場合、すべてのボタンの重みを１と設定していますので、1:1:1の横幅でボタンが表示されます。
たとえば、一つの要素を重み２にすれば2:1:1の比率でボタンの横幅が配分され、１個目のボタンは画面の半分を占領することになります。

また、このプロパティ設定をverticalのLinearLayoutに使うと、縦方向の重みづけができるので、７行目や３２行目のLinearLayoutに均等な重みをもたせて、縦も均等に表示しています。


horizontalに設定したLinearLayoutの中にさらにButtonを増やせば横の数を増やせますし、
horizontalに設定したLinearLayout自体を中身の要素ごと増やして行けば縦の数を増やせます。
領域の設定に具体的な数値を使わず、match_parentで済ませているので、形が崩れる心配もありません。

今回はLinearLayoutの入れ子という半ば強引といえる方法だと思います。ほかの方法をご存じの方いましたら、ぜひコメントをおねがいします！ 質問もぜひどうぞ！

Tipsは以上です。
