# 🚀 vim-neoquickrun

**Execute commands quickly and show results in Vim/Neovim**

A modern, TypeScript-based reimplementation of [vim-quickrun](https://github.com/thinca/vim-quickrun) using [denops.vim](https://github.com/vim-denops/denops.vim).

[![License](https://img.shields.io/badge/license-zlib-blue.svg)](LICENSE.txt)
[![Deno](https://img.shields.io/badge/deno-%5E1.40-green.svg)](https://deno.land/)
[![Vim](https://img.shields.io/badge/vim-8.1%2B-green.svg)](https://www.vim.org/)
[![Neovim](https://img.shields.io/badge/neovim-0.5%2B-green.svg)](https://neovim.io/)

---

## ✨ Features

- **⚡ Fast Execution** - Execute code snippets and files instantly
- **🎯 Multiple Runners** - System, Job, Terminal, Shell, Remote, Vimscript
- **📤 Flexible Output** - Buffer, Quickfix, Float (Neovim), Browser, and more
- **🪝 Extensible Hooks** - Modify behavior with pre/post execution hooks
- **🔧 Highly Configurable** - Customize execution per filetype
- **💪 Type-Safe** - Written in TypeScript with strict typing
- **🎨 Functional** - Immutable data structures and pure functions

---

## 📦 Installation

### Requirements

- **Vim** 8.1+ or **Neovim** 0.5+
- **Deno** (latest version)
- **[denops.vim](https://github.com/vim-denops/denops.vim)**

### Using [vim-plug](https://github.com/junegunn/vim-plug)

```vim
Plug 'vim-denops/denops.vim'
Plug 'aiya000/vim-neoquickrun'
```

### Using [dein.vim](https://github.com/Shougo/dein.vim)

```vim
call dein#add('vim-denops/denops.vim')
call dein#add('aiya000/vim-neoquickrun')
```

### Using [packer.nvim](https://github.com/wbthomason/packer.nvim)

```lua
use {
  'aiya000/vim-neoquickrun',
  requires = { 'vim-denops/denops.vim' }
}
```

---

## 🚀 Quick Start

### Basic Usage

Execute current buffer:

```vim
:NeoQuickRun
```

Execute with specific runner:

```vim
:NeoQuickRun -runner job
```

Execute Python code:

```vim
:NeoQuickRun python
```

### Key Mappings

```vim
" Execute current buffer
nmap <Leader>r <Plug>(neoquickrun)

" Execute selected text in visual mode
vmap <Leader>r <Plug>(neoquickrun)

" Operator mode
nmap <Leader>o <Plug>(neoquickrun-op)
```

### Configuration Example

```vim
let g:neoquickrun_config = {
\   '_': {
\     'runner': 'job',
\     'outputter': 'buffer',
\   },
\   'python': {
\     'command': 'python3',
\     'exec': '%c %o %s %a',
\   },
\   'javascript': {
\     'command': 'node',
\   },
\   'rust': {
\     'exec': ['cargo build', 'cargo run'],
\   },
\ }
```

---

## 📚 Runners

| Runner | Description | Requirements |
|--------|-------------|--------------|
| **system** | Synchronous execution using `Deno.Command` | None |
| **job** | Asynchronous execution using Vim's job feature | `+job` |
| **terminal** | Execute in terminal window | `+terminal` |
| **shell** | Execute using `:!` command | None |
| **remote** | Background execution using clientserver | `+clientserver` |
| **vimscript** | Execute as Vim script | None |

---

## 📤 Outputters

### Basic Outputters

| Outputter | Description |
|-----------|-------------|
| **buffer** | Output to buffer window |
| **message** | Output to message area |
| **null** | Discard output |

### Advanced Outputters

| Outputter | Description |
|-----------|-------------|
| **quickfix** | Output to quickfix window |
| **loclist** | Output to location list |
| **file** | Output to file |
| **variable** | Output to Vim variable |
| **multi** | Output to multiple outputters |
| **buffered** | Buffer output and pass to another outputter |
| **error** | Switch outputter based on exit status |
| **browser** | Open output in browser |
| **popup** | Output to popup window (Vim 8.2+) |
| **float** | 🆕 Output to floating window (Neovim only) |

### 🆕 Float Outputter (New!)

The float outputter displays results in a Neovim floating window:

```vim
let g:neoquickrun_config = {
\   'python': {
\     'outputter': 'float',
\     'outputter/float/width': 80,
\     'outputter/float/height': 20,
\     'outputter/float/row': 5,
\     'outputter/float/col': 10,
\     'outputter/float/border': 'rounded',
\   },
\ }
```

---

## 🪝 Hooks

| Hook | Description |
|------|-------------|
| **cd** | Change directory before execution |
| **eval** | Wrap source with template |
| **output_encode** | Convert output encoding |
| **shebang** | Extract command from shebang line |
| **sweep** | Remove temporary files |
| **time** | Measure and display execution time |

### Example: Using Hooks

```vim
let g:neoquickrun_config = {
\   'python': {
\     'hooks': ['time', 'cd'],
\     'hook/cd/directory': '%:p:h',
\     'hook/time/enable': 1,
\   },
\ }
```

---

## ⚙️ Configuration

### Global Configuration

```vim
let g:neoquickrun_config = {
\   '_': {
\     'runner': 'job',
\     'outputter': 'buffer',
\   },
\ }
```

### Buffer-Local Configuration

```vim
let b:neoquickrun_config = {
\   'runner': 'terminal',
\ }
```

### Command-Line Options

```vim
:NeoQuickRun -runner job -outputter quickfix
```

---

## 🎯 Examples

### Execute with Compiler Flags

```vim
:NeoQuickRun c -cmdopt '-Wall -O2'
```

### Execute and Open in Browser

```vim
let g:neoquickrun_config = {
\   'markdown': {
\     'command': 'pandoc',
\     'cmdopt': '-s',
\     'exec': '%c %o %s -o %s:r.html',
\     'outputter': 'browser',
\   },
\ }
```

### Multi-Step Execution

```vim
let g:neoquickrun_config = {
\   'cpp': {
\     'exec': ['g++ -o %s:r %s', './%s:r'],
\   },
\ }
```

---

## 🔄 Migration from vim-quickrun

### Command Changes

| Old | New |
|-----|-----|
| `:QuickRun` | `:NeoQuickRun` |
| `quickrun#run()` | `neoquickrun#run()` |
| `g:quickrun_config` | `g:neoquickrun_config` |

### Removed Features

The following features were removed for simplicity:

- Module registration system (`quickrun#module#register()`)
- Session management functions (`quickrun#session#*()`)
- Legacy runners: `runner/vimproc`, `runner/python`, `runner/concurrent_process`
- Legacy outputter: `outputter/buffer_legacy`

---

## 🛠️ Development

### Technology Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Deno
- **Framework**: denops.vim
- **Style**: Functional Programming (immutable, pure functions)

### Building

```bash
# Check types
deno check denops/neoquickrun/main.ts

# Run linter
deno lint

# Format code
deno fmt

# Run tests
deno test --allow-all
```

---

## 📄 License

zlib License

Original work: Copyright (c) 2009 thinca &lt;thinca@gmail.com&gt;
Derivative work: Copyright (c) 2025 aiya000 &lt;aiya000.develop@gmail.com&gt;

This is a derivative work of [vim-quickrun](https://github.com/thinca/vim-quickrun).

---

## 🙏 Acknowledgments

This project is a modern reimplementation of [vim-quickrun](https://github.com/thinca/vim-quickrun) by thinca.
Special thanks to the original author for creating such a useful plugin.

---

## 📝 See Also

- [vim-quickrun (original)](https://github.com/thinca/vim-quickrun)
- [denops.vim](https://github.com/vim-denops/denops.vim)
- [Deno](https://deno.land/)
