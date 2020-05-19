local enums = {
  gender = {
    [0] = "MALE",
    [1] = "FEMALE",
    [2] = "SPIRIT",
    [3] = "ARMOR",
  },
  attack_attribute = {
    [0] = "PHYSICAL",
    [1] = "MAGIC",
    [3] = "RECOVERS_UP",
  },
  boolean = {
    [0] = "FALSE",
    [1] = "TRUE",
  },
  cc = {
    [0] = "NONE",
    [1] = "CLASS_CHANGE",
    [2] = "AWAKENING",
    [3] = "SECOND_AWAKENING_A",
    [4] = "SECOND_AWAKENING_B",
  }
}

local function get_enum(enum_name, value)
  local enum = assert(enums[enum_name])
  return enum[value] or ("? (" .. value .. ")")
end

local function indent(str, dent)
  dent = dent or "\t"
  return (str:gsub("\n(.)", "\n" .. dent .. "%1"))
end

local function pad(s, n)
  s = tostring(s)
  return (" "):rep(n - #s) .. s
end

local function gender(value)
  return get_enum("gender", value)
end

local builtin_format = {
  n = "format.%1",
  range = "format.%1 range",
  chance = "format.%1% chance",
  percent = "format.%1%",
  delay = "format.%1 frame delay",
  flag = "enum.boolean",
}

local function format(lookup, id, params)
  local out = ""
  local info = lookup[id]
  local post = {}
  if info then
    out = out .. info.name .. " (" .. id .. "):"
    if info.args then
      out = out .. " "
      local first = true
      local stop = false
      for i, arg in ipairs(info.args) do
        local opt = false
        if arg:match("^opt%.") then
          opt = true
          arg = assert(arg:match("^opt%.(.*)$"))
        end
        local str = ""
        local param = params[i]
        
        local builtin = builtin_format[arg]
        if builtin then
          arg = builtin
        end
        
        if arg == "_" or opt and param == 0 then
          -- nothing
        elseif arg == "add_n" then
          if param < 0 then
            str = param
          else
            str = "+" .. param
          end
        elseif arg == "mod" then
          str = "x" .. (param/100)
        elseif arg == "add_percent" then
          if param < 0 then
            str = param .. "%"
          else
            str = "+" .. param .. "%"
          end
        elseif arg == "class" then
          if param == 0 then
            -- nothing
          else
            local class = require("lib/class")
            str = class.get_name_p(param)
          end
        elseif arg == "missile" then
          --str = "missile " .. param
          local missile = require("lib/missile")
          local mis_str = missile.parse(param)
          table.insert(post, mis_str)
        elseif arg:match("^mutex") then
          local mutex_id = id
          local id_str = arg:match("%.(%d+)")
          if id_str then
            mutex_id = assert(tonumber(id_str))
          end
          str = "mutex " .. mutex_id .. ":" .. param
        elseif arg == "filter" then
          local param2 = params[i + 1]
          local param3 = params[i + 2]
          if param == 0 and param2 == 0 and param3 == 0 then
            -- nothing
          elseif param == 0 and param2 ~= 0 then
            str = class.get_name_p(param2)
            if param3 ~= 0 then
              str = str .. ", " .. class.get_name_p(param3)
            end
          elseif param == 1 and param2 == 1 and param3 == 0 then
            str = "(rarity restriction)"
          elseif param == 1 and param2 == 2 and param3 == 0 then
            str = "Melee"
          elseif param == 1 and param2 == 5 then
            str = unit.get_name(param3)
          elseif param == 1 and param2 == 6 then
            str = rarity.get_name(param3)
          elseif param == 2 and param2 == 0 and param3 == 0 then
            str = "Dwarf/Elf"
          elseif param == 3 and param2 == 0 and param3 == 0 then
            str = "Rider"
          elseif param == 4 and param2 == 0 and param3 == 0 then
            str = "Magical"
          elseif param == 5 and param2 == 0 and param3 == 0 then
            str = "Dragon"
          else
            str = "?"
          end
          stop = true
        elseif arg:match("^enum%.") then
          local enum_name = assert(arg:match("%.(.*)$"))
          local enum = assert(enums[enum_name])
          str = (enum[param] or "?") .. " (" .. param .. ")"
        elseif arg:match("^format%.") then
          local replace_str = assert(arg:match("%.(.*)$"))
          str = replace_str:gsub("%%1", tostring(param), 1)
        end
        if str ~= "" then
          if not first then
            out = out .. ", "
          end
          out = out .. str
          first = false
        end
      end
    end
  else
    out = out .. "ID " .. id .. ":"
  end
  if #params > 0 then
    out = out .. " (" .. table.concat(params, "/") .. ")\n"
  end
  for _, str in ipairs(post) do
    out = out .. "  Detail:\n"
    out = out .. "    " .. str:gsub("\n(.)", "\n\t    %1")
  end
  
  return out
end

local function get_notes(command)
  local out = ""
  for classes in command:gmatch("IsClassType%(([%d,%s]+)%)") do
    for id in classes:gmatch("%d+") do
      id = assert(tonumber(id))
      local class = require("lib/class")
      out = out .. "Note: class type " .. id .. " is \"" .. class.get_name_p(id) .. "\"\n"
    end
  end
  for comp, id in command:gmatch("GetClassType%(%)%s*([!=<>]*)%s*(%d+)") do
    id = assert(tonumber(id))
    if comp == "==" or id ~= 100 then
      local class = require("lib/class")
      out = out .. "Note: class type " .. id .. " is \"" .. class.get_name_p(id) .. "\"\n"
    end
  end
  for cards in command:gmatch("IsCardID%(([%d,%s]+)%)") do
    for id in cards:gmatch("%d+") do
      id = assert(tonumber(id))
      local unit = require("lib/unit")
      out = out .. "Note: card " .. id .. " is \"" .. unit.get_name(id) .. "\"\n"
    end
  end
  for gender in command:gmatch("GetGender%(%)%s*%=%=%s*(%d+)") do
    gender = assert(tonumber(gender))
    if enums.gender[gender] then
      out = out .. "Note: gender " .. gender .. " is " .. enums.gender[gender] .. "\n"
    end
  end
  for gender in command:gmatch("IsGender%((%d+)%)") do
    gender = assert(tonumber(gender))
    if enums.gender[gender] then
      out = out .. "Note: gender " .. gender .. " is " .. enums.gender[gender] .. "\n"
    end
  end
  for rare in command:gmatch("GetRaryty%(%)%s*[][!><=]*%s*(%d+)") do
    rare = assert(tonumber(rare))
    local rarity = require("lib/rarity")
    out = out .. "Note: rarity " .. rare .. " is \"" .. rarity.get_name(rare) .. "\"\n"
  end
  for rare in command:gmatch("IsRaryty%((%d+)%)") do
    rare = assert(tonumber(rare))
    local rarity = require("lib/rarity")
    out = out .. "Note: rarity " .. rare .. " is \"" .. rarity.get_name(rare) .. "\"\n"
  end
  for cc in command:gmatch("GetClassChange%(%)%s*[!><=]*%s*(%d+)") do
    cc = assert(tonumber(cc))
    if enums.cc[cc] then
      out = out .. "Note: class change " .. cc .. " is " .. enums.cc[cc] .. "\n"
    end
  end
  if command:match("GetClassID%(%)%s*%<%s*10000") then
    out = out .. "Note: classes less than 10000 are melee classes\n"
  end
  if command:match("GetClassType%(%)%s*%<%s*100") then
    out = out .. "Note: class types less than 100 are melee class types\n"
  end
  if command:match("GetClassID%(%)%s*%>%=%s*10000") then
    out = out .. "Note: classes greater than or equal to 10000 are ranged classes\n"
  end
  if command:match("GetClassType%(%)%s*%>%=%s*100") then
    out = out .. "Note: class types greater than or equal to 100 are ranged class types\n"
  end
  return out
end

return {
  indent = indent,
  pad = pad,
  gender = gender,
  get_enum = get_enum,
  format = format,
  get_notes = get_notes,
}
