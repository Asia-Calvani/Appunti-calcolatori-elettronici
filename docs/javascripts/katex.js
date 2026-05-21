// javascripts/katex.js
document$.subscribe(() => {
  if (typeof renderMathInElement !== "function") return;
  renderMathInElement(document.body, {
    delimiters: [
      {left: "\\[", right: "\\]", display: true},
      {left: "\\(", right: "\\)", display: false},
      {left: "$$", right: "$$", display: true},
      {left: "$", right: "$", display: false}
    ],
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
  });
});