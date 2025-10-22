" vim-neoquickrun autoload functions
" Maintainer: aiya000 <aiya000.develop@gmail.com>

" Main function called from :NeoQuickRun command
function! neoquickrun#run(args, count, line1, line2) abort
  " Call denops
  call denops#request('neoquickrun', 'run', [a:args])
endfunction

" Operator function
function! neoquickrun#operator(type) abort
  let l:save_reg = @@

  if a:type ==# 'char'
    silent execute 'normal! `[v`]y'
  elseif a:type ==# 'line'
    silent execute 'normal! `[V`]y'
  elseif a:type ==# 'block'
    silent execute 'normal! `[\<C-v>`]y'
  else
    return
  endif

  let l:src = @@
  let @@ = l:save_reg

  " Run with selected text
  call denops#request('neoquickrun', 'run', ['-src ' . shellescape(l:src)])
endfunction

" Command completion
function! neoquickrun#complete(arglead, cmdline, cursorpos) abort
  let l:options = [
        \ '-type',
        \ '-exec',
        \ '-command',
        \ '-cmdopt',
        \ '-src',
        \ '-srcfile',
        \ '-args',
        \ '-input',
        \ '-outputter',
        \ '-runner',
        \ '-mode',
        \ ]

  " Filter options based on current input
  return filter(copy(l:options), 'v:val =~# "^" . a:arglead')
endfunction
