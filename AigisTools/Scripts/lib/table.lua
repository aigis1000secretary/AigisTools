-- table.lua library
-- v1.0
-- author: lzlis

local function print_table(out, t, ord, tostr)
  local count = #t
  if #t > 0 then
    tostr = tostr or tostring
    local fields
    if ord then
      fields = ord
    else
      fields = {}
      for f, _ in pairs(t[1]) do
        table.insert(fields, f)
      end
    end
    
    local lens = {}
    
    for i, f in ipairs(fields) do
      assert(type(f) == 'string')
      lens[i] = #f
    end
    
    for _, record in ipairs(t) do
      for i, f in ipairs(fields) do
        lens[i] = math.max(lens[i], #tostr(record[f]))
      end
    end
    
    local function padl(s, n)
      return s .. (" "):rep(n - #s)
    end
    
    local function padr(s, n)
      return (" "):rep(n - #s) .. s
    end
    
    for i, f in ipairs(fields) do
      out:write(padr(f, lens[i]), " ")
    end
    out:write("\n")
    
    for _, record in ipairs(t) do
      for i, f in ipairs(fields) do
        out:write(padr(tostr(record[f]), lens[i]), " ")
      end
      out:write("\n")
    end
  end
end

return {
  print = print_table,
}
