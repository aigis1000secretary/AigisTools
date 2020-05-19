-- xml.lua library
-- v1.0
-- author: lzlis

local function parser(data)
  
  local function getchar(offset)
    return offset + 1, data:sub(offset, offset)
  end
  
  local function getchars(first, last)
    return last + 1, data:sub(first, last)
  end
  
  local function chomp(offset)
    while true do
      local next_offset, c = getchar(offset)
      if not c:match("%s") then
        break
      end
      offset = next_offset
    end
    return offset
  end
  
  local function consume(offset, c)
    local next_offset, peek = getchar(offset)
    assert(c == peek, ("unexpected '%s' at 0x%x (expected '%s')"):format(peek, offset - 1, c))
    return next_offset
  end
  
  local function parse_word(offset)
    local word = ""
    while true do
      local next_offset, c = getchar(offset)
      if not c:match("[%w_]") then
        break
      end
      word = word .. c
      offset = next_offset
    end
    return offset, word
  end
  
  local k_endtag = {}
  
  local function parse(offset)
    offset = chomp(offset)
    local next_offset, peek = getchar(offset)
    if peek == "<" then
      offset = next_offset
      local endtag = false
      local qtag = false
      next_offset, peek = getchar(offset)
      if peek == "/" then
        endtag = true
        offset = next_offset
      elseif peek == "?" then
        qtag = true
        offset = next_offset
      end
      local tag
      offset, tag = parse_word(offset)
      assert(#tag > 0, ("unable to parse tag at 0x%x"):format(offset - 1))
      if endtag then
        offset = consume(offset, ">")
        return offset, k_endtag, tag
      end
      local attributes = {}
      local emptytag = false
      while true do
        offset = chomp(offset)
        next_offset, peek = getchar(offset)
        if peek == ">" then
          offset = next_offset
          break
        elseif peek == "/" then
          assert(not qtag)
          offset = consume(next_offset, ">")
          emptytag = true
          break
        elseif peek == "?" then
          offset = consume(next_offset, ">")
          emptytag = true
          break
        else
          local attrb
          offset, attrb = parse_word(offset)
          assert(#attrb > 0, ("unable to parse attribute name at 0x%x"):format(offset - 1))
          offset = chomp(offset)
          offset = consume(offset, "=")
          offset = chomp(offset)
          offset = consume(offset, '"')
          local value = ""
          while true do
            local c
            offset, c = getchar(offset)
            if c == '"' then
              break
            elseif c == "\\" then
              assert("not supported")
            end
            value = value .. c
          end
          attributes[#attributes + 1] = {name = attrb, value = value}
        end
      end
      local contents = {}
      local hastext = false
      if not emptytag then
        while true do
          local inner_thing, etc
          offset, inner_thing, etc = parse(offset)
          if inner_thing == k_endtag then
            assert(tag == etc)
            break
          elseif type(inner_thing) == "string" then
            hastext = true
            contents[#contents + 1] = inner_thing
          else
            contents[#contents + 1] = inner_thing
          end
        end
      end
      if hastext then
        assert(#contents == 1)
        contents = contents[1]
      end
      if qtag then
        return offset, nil
      else
        return offset, {tag = tag, attributes = attributes, contents = contents}
      end
    else
      local start = offset
      --print(("start 0x%x"):format(offset - 1))
      while true do
        next_offset = chomp(offset)
        --print(("chomp 0x%x"):format(next_offset - 1))
        next_offset, peek = getchar(next_offset)
        --print(("getchar 0x%x %s"):format(next_offset - 1, peek))
        if peek == "<" then break end
        offset = next_offset
      end
      --print(("0x%x"):format(offset - 1))
      local _, text = getchars(start, offset - 1)
      --print(text, offset)
      return offset, text
    end
  end
  
  return function()
    local offset, obj = 1
    repeat
      offset, obj = parse(offset)
    until obj
    return obj
  end
  
end

local function parse(text)
  return parser(text)()
end

local function totable(obj)
  local da = obj.contents

  local count = #da[1].contents
  local things = {}

  for i = 1, count do
    local thing = {}
    for _, elt in ipairs(da) do
      local T = nil
      for _, attrb in ipairs(elt.attributes) do
        if attrb.name == "T" then
          assert(T == nil)
          T = attrb.value
        end
      end
      assert(T ~= nil)
      local value
      if T == "I" or T == "F" then
        value = assert(tonumber(elt.contents[i].contents))
      else
        error("unknown type: " .. T)
      end
      thing[elt.tag] = value
    end
    things[i] = thing
  end
  
  return things
end

local function toorder(obj)
  local da = obj.contents
  
  local ord = {}
  
  for i, elt in ipairs(da) do
    ord[i] = elt.tag
  end
  
  return ord
end

return {
  parse = parse,
  totable = totable,
  toorder = toorder,
}
