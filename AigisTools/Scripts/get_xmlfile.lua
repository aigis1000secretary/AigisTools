-- get_xmlfile.lua
-- v1.0
-- author: lzlis

local xmldoc = require("lib/xmldoc")
local xml = require("lib/xml")
local tb = require("lib/table")

local out = "out"
local fname, opt = ...

local text
if opt == "raw2" then
  text = xmldoc.getfileraw(nil, fname)
else
  text = xmldoc.getfile(nil, fname)
end

if opt == "raw" or opt == "raw2" then
  local h = assert(io.open("out\\" .. fname .. ".xml", "w"))
  assert(h:write(text))
  assert(h:close())
else
  local obj = xml.parse(text)
  local t = xml.totable(obj)
  local ord = xml.toorder(obj)

  local h = assert(io.open("out\\" .. fname .. ".txt", "w"))
  tb.print(h, t, ord)
  assert(h:close())
end