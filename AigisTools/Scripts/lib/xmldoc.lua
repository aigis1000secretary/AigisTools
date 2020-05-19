-- xmldoc.lua library
-- v1.0
-- author: lzlis

local decode = require("lib/decode")
local decompress = require("lib/decompress")

local xml_map = {
  ["cards"] = "GRs733a4",
  ["missions"] = "QxZpjdfV",
}

local function getdir(id)
  if id == nil then
    local h = assert(io.open("xml.txt", 'rb'))
    local text = assert(h:read('*a'))
    assert(h:close())
    
    id = assert(text:match("%S+"))
  end
  
  return "Data\\XML\\" .. id .. "\\"
end

local function getfile(id, fname)
  fname = xml_map[fname] or fname
  local path = getdir(id)
  local h = assert(io.open(path .. fname, 'rb'))
  local text = assert(h:read('*a'))
  assert(h:close())
  text = decode.decode_xml(text)
  text = decompress.decompress(text)
  return text
end

local function getfileraw(id, fname)
  fname = xml_map[fname] or fname
  local path = getdir(id)
  local h = assert(io.open(path .. fname, 'rb'))
  local text = assert(h:read('*a'))
  assert(h:close())
  text = decode.decode_xml(text)
  --text = decompress.decompress(text)
  return text
end

return {
  getfile = getfile,
  getfileraw = getfileraw,
}
