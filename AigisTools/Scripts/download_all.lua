-- download_all.lua
-- v1.0
-- author: lzlis

local dl = require("lib/download")

local entries = dl.getlist()
for name, _ in pairs(entries) do
  dl.getfile(nil, name)
end
