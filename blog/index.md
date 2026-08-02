---
title: ATRVASA Engineering Blog
description: Deep dives into Rust, eBPF, and zero-overhead Linux kernel observability.
sidebar: false
layout: page
---

<style>
/* Custom CSS just for the blog index page to make it look like a blog */
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
  
  /* --- بخش اضافه‌شده برای حل مشکل بریدگی --- */
  line-height: 1.3; 
  padding-bottom: 0.1em; /* کمی فضا برای حروف پایین‌رونده مثل g */
  padding-top: 0.1em;    /* کمی فضا برای حروف بالارونده */
  /* ------------------------------------------ */

  background: linear-gradient(120deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text; /* استاندارد جدیدتر را هم اضافه کنید */
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
    <a href="/blog/bypassing-tcp-stack-with-ebpf" class="article-card">
      <h2 class="article-title">Zero-Copy Microservices: Bypassing the TCP Stack with eBPF</h2>
      <div class="article-meta">
        <span>📅 Aug 15, 2026</span>
        <span>⏱️ 8 min read</span>
        <span>🏷️ eBPF, Architecture</span>
      </div>
      <p class="article-excerpt">Discover how ATRVASA uses BPF_PROG_TYPE_SOCK_OPS and sk_msg to short-circuit local traffic, entirely avoiding the Linux TCP/IP stack overhead.</p>
    </a>
    <a href="/blog/why-rust-for-kernel-control-planes" class="article-card">
      <h2 class="article-title">Why We Chose Rust over C/Go for the ATRVASA Control Plane</h2>
      <div class="article-meta">
        <span>📅 Jul 22, 2026</span>
        <span>⏱️ 6 min read</span>
        <span>🏷️ Rust, Security</span>
      </div>
      <p class="article-excerpt">A technical breakdown of leveraging the Aya framework for memory-safe eBPF deployment and why abandoning the traditional C-toolchain was the right call.</p>
    </a>
  </div>
</div>