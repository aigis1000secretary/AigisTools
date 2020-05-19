-- get_file.lua
-- v1.0
-- author: lzlis

local dl = require("lib/download")
local parse_al = require("lib/parse_al")
local output_al = require("lib/output_al")

local fname, mode = ...
local out = "out\\files\\"
local working = "working\\"

local copy = {
  [".png"] = true,
  [".ogg"] = true,
  [".mp3"] = true,
  [".html"] = true,
  [".lua"] = true,
  [".js"] = true,
  [".txt"] = true,
}
local ext = fname:match("%.%w+")
copy = copy[ext]

local text = dl.getfile(nil, fname)
if copy or mode == "copy" then
  local h = assert(io.open(out .. "\\" .. fname, 'wb'))
  assert(h:write(text))
  assert(h:close())
elseif mode == "decompress" or mode == "dec" then
  local obj = parse_al.decompress(text)
  local h = assert(io.open(out .. "\\" .. fname .. ".dec", 'wb'))
  assert(h:write(obj))
  assert(h:close())
else
  local obj = parse_al.parse(text)
  output_al.output(obj, out .. "\\" .. fname .. "\\", working)
end
