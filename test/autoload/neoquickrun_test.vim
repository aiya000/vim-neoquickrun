" Tests for autoload/neoquickrun.vim

let s:suite = themis#suite('autoload/neoquickrun')
let s:assert = themis#helper('assert')

" Test neoquickrun#complete
function! s:suite.complete_returns_list_of_options() abort
  let l:result = neoquickrun#complete('', 'NeoQuickRun', 0)
  call s:assert.is_list(l:result)
  call s:assert.not_empty(l:result)
endfunction

function! s:suite.complete_returns_all_options_for_empty_arglead() abort
  let l:result = neoquickrun#complete('', 'NeoQuickRun', 0)
  call s:assert.includes(l:result, '-type')
  call s:assert.includes(l:result, '-exec')
  call s:assert.includes(l:result, '-command')
  call s:assert.includes(l:result, '-cmdopt')
  call s:assert.includes(l:result, '-src')
  call s:assert.includes(l:result, '-srcfile')
  call s:assert.includes(l:result, '-args')
  call s:assert.includes(l:result, '-input')
  call s:assert.includes(l:result, '-outputter')
  call s:assert.includes(l:result, '-runner')
  call s:assert.includes(l:result, '-mode')
endfunction

function! s:suite.complete_filters_by_arglead() abort
  let l:result = neoquickrun#complete('-typ', 'NeoQuickRun -typ', 10)
  call s:assert.is_list(l:result)
  call s:assert.includes(l:result, '-type')
  for l:item in l:result
    call s:assert.match(l:item, '^-typ')
  endfor
endfunction

function! s:suite.complete_filters_by_prefix() abort
  let l:result = neoquickrun#complete('-s', 'NeoQuickRun -s', 0)
  call s:assert.includes(l:result, '-src')
  call s:assert.includes(l:result, '-srcfile')
  for l:item in l:result
    call s:assert.match(l:item, '^-s')
  endfor
endfunction

function! s:suite.complete_returns_empty_list_for_unknown_prefix() abort
  let l:result = neoquickrun#complete('-zzz', 'NeoQuickRun -zzz', 0)
  call s:assert.empty(l:result)
endfunction

function! s:suite.complete_returns_matching_options_for_dash_o() abort
  let l:result = neoquickrun#complete('-o', 'NeoQuickRun -o', 0)
  call s:assert.includes(l:result, '-outputter')
endfunction
