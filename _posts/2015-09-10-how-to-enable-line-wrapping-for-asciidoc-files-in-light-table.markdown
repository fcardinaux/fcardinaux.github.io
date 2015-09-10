---
layout: post
title:  "Light Table: How To Enable Line Wrapping For AsciiDoc Files"
date:   2015-09-10 12:00:01
categories: asciidoc lighttable howto
comments: True
---
By default, line wrapping is enabled for plain-text and Markdown files only, not for AsciiDoc files.

To change this:

1. Open the `default.behaviors` file (_View > Commands > Settings: Default behaviors_).
2. Search the following line: `[:editor.markdown :lt.objs.editor/wrap]`.
3. Immediately below, add the same behavior for AsciiDoc files:

   [:editor.asciidoc :lt.objs.editor/wrap]

Save the `default.behaviors` file. The change should be immediately visible if you open an AsciiDoc file.
