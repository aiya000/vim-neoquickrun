" Tests for plugin/neoquickrun.vim

let s:suite = themis#suite('plugin/neoquickrun')
let s:assert = themis#helper('assert')

" Test that the plugin is loaded
function! s:suite.plugin_is_loaded() abort
  call s:assert.exists('g:loaded_neoquickrun')
endfunction

" Test NeoQuickRun command is defined
function! s:suite.neoquickrun_command_is_defined() abort
  call s:assert.true(exists(':NeoQuickRun') == 2)
endfunction

" Test key mappings are defined
function! s:suite.plug_neoquickrun_op_is_defined() abort
  call s:assert.true(hasmapto('<Plug>(neoquickrun-op)', 'n'))
endfunction

function! s:suite.plug_neoquickrun_normal_is_defined() abort
  call s:assert.true(hasmapto('<Plug>(neoquickrun)', 'n'))
endfunction

function! s:suite.plug_neoquickrun_visual_is_defined() abort
  call s:assert.true(hasmapto('<Plug>(neoquickrun)', 'v'))
endfunction

" Test that loading plugin twice does not cause errors
function! s:suite.plugin_not_reloaded_when_already_loaded() abort
  " g:loaded_neoquickrun should already be set from first load
  let l:prev = g:loaded_neoquickrun
  " Sourcing the plugin again should be a no-op
  runtime plugin/neoquickrun.vim
  call s:assert.equals(g:loaded_neoquickrun, l:prev)
endfunction
