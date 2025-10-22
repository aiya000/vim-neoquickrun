" vim-neoquickrun - Execute commands quickly
" Maintainer: aiya000 <aiya000.develop@gmail.com>
" Original: thinca <thinca@gmail.com>
" License: zlib License

if exists('g:loaded_neoquickrun')
  finish
endif
let g:loaded_neoquickrun = 1

" Command
command! -nargs=* -range=0 -complete=customlist,neoquickrun#complete
      \ NeoQuickRun call neoquickrun#run(<q-args>, <count>, <line1>, <line2>)

" Key mappings
nnoremap <silent> <Plug>(neoquickrun-op)
      \ :<C-u>set operatorfunc=neoquickrun#operator<CR>g@

nnoremap <silent> <Plug>(neoquickrun) :<C-u>NeoQuickRun -mode n<CR>
vnoremap <silent> <Plug>(neoquickrun) :<C-u>NeoQuickRun -mode v<CR>
