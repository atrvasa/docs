---
title: ATRVASA Engineering Blog
description: Deep dives into Rust, eBPF, and zero-overhead Linux kernel observability.
sidebar: false
layout: page
---

<style> 
.blog-index {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}
.blog-header {
  text-align: center;
  margin-bottom: 50px;
}
.blog-header h1 {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
  
 
  line-height: 1.3; 
  padding-bottom: 0.1em; 
  padding-top: 0.1em;     

  background: linear-gradient(120deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text; 
}
.blog-header p {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
}
.article-card {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  text-decoration: none !important;
  background-color: var(--vp-c-bg-soft);
}
.article-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.article-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 10px 0;
}
.article-meta {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
  margin-bottom: 12px;
  display: flex;
  gap: 15px;
}
.article-excerpt {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0;
}
</style>

<div class="blog-index">
  <div class="blog-header">
    <h1>Engineering Blog</h1>
    <p>Notes on kernel hacking, memory safety, and Zero-Trust architecture.</p>
  </div>

  <div class="articles">    
    <a href="/blog/00-rfcs/atrvasa-core-architecture" class="article-card">
      <h2 class="article-title">Why the Future of Zero-Trust is in the Kernel Layer</h2>
      <div class="article-meta">
        <span>📅 Aug 2, 2026</span>
        <span>⏱️ 5 min read</span>
        <span>🏷️ #eBPF #Rust #ZeroTrust</span>
      </div>
      <p class="article-excerpt">Discover how ATRVASA uses Rust and eBPF to eliminate user-space bottlenecks and build a zero-overhead firewall. Read our first architectural RFC.</p>
    </a>
  </div>

  <news-letter />
</div>
