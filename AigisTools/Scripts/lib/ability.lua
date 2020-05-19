local dl = require("lib/download")
local parse_al = require("lib/parse_al")
local class = require("lib/class")
local missile = require("lib/missile")
local unit = require("lib/unit")
local rarity = require("lib/rarity")

local abilities = dl.getfile(nil, "AbilityList.atb")
abilities = parse_al.parse(abilities)
abilities = parse_al.totable(abilities)

local configs = dl.getfile(nil, "AbilityConfig.atb")
configs = parse_al.parse(configs)
configs = parse_al.totable(configs)

local ability_text = dl.getfile(nil, "AbilityText.atb")
ability_text = parse_al.parse(ability_text)
ability_text = parse_al.totable(ability_text)

local k_skill_chance_boost = "opt.format.+%1% chance during skill"
local k_max_percent = "format.max %1%"
local k_threshold_percent = "format.%1% threshold"
local k_frames = "format.%1 frames"
local k_nekomata = {"format.enemy %1%", "format.ally %1%"}

local influence_lookup = {
  [1] = {name = "ATK on-hit mod", args = {"mod", "chance"}},
  [2] = {name = "ATK dragon mod", args = {"mod", "chance"}},
  [3] = {name = "ATK yokai mod", args = {"mod", "chance"}},
  [4] = {name = "ATK undead mod", args = {"mod", "chance"}},
  [5] = {name = "ATK demon mod", args = {"mod", "chance"}},
  [6] = {name = "ATK armored mod", args = {"mod", "chance"}},
  --
  [8] = {name = "Critical hit", args = {"chance", "mod", k_skill_chance_boost}},
  [9] = {name = "Critical heal", args = {"chance", "mod", k_skill_chance_boost}},
  [10] = {name = "Cost reduction", args = {"n", "filter"}},
  [11] = {name = "Enemy HP and ATK mod", args = {"percent"}},
  [12] = {name = "HP mod", args = {"percent", "filter"}},
  [13] = {name = "ATK mod", args = {"percent", "filter"}},
  [14] = {name = "DEF mod", args = {"percent", "filter"}},
  [15] = {name = "MR mod", args = {"add_n", "filter"}},
  [16] = {name = "Skill duration mod", args = {"percent", "filter"}},
  [17] = {name = "Heal HP", args = {"opt.percent", "opt.n"}},
  [18] = {name = "Eliminate cooldown", args = {"chance"}},
  [19] = {name = "Nullify attack", args = {"chance"}},
  [20] = {name = "Physical Evasion", args = {"add_percent"}},
  [21] = {name = "Range", args = {"add_n"}},
  [22] = {name = "True damage", args = {"chance"}},
  [23] = {name = "Assassinate", args = {"percent"}},
  [24] = {name = "Gold GET!", args = {"chance"}},
  [25] = {name = "Priority change", args = {"enum.priority"}},
  [26] = {name = "Projectile count", args = {"chance", "n", "delay"}},
  [27] = {name = "Weather cost reduction", args = {"enum.weather", "n"}},
  [28] = {name = "Weather ATK mod",args = {"enum.weather", "percent"}},
  [29] = {name = "Weather resist", args = {"enum.weather", "percent"}},
  [30] = {name = "Regenerate HP", args = {"opt.n", "delay", "opt.percent"}},
  [31] = {name = "Regeneration restriction", args = {"enum.state"}},
  [32] = {name = "Regeneration mod", args = {"enum.state", "_", "percent"}},
  [33] = {name = "Starting UP", args = {"add_n"}},
  [34] = {name = "Prevent status ailment"},
  [35] = {name = "Assassinate mod", args = {"percent"}},
  [36] = {name = "Attack restores HP%", args = {"percent"}},
  [37] = {name = "Received damage restores ally HP", args = {"percent"}},
  [38] = {name = "Instantly kill enemies below HP%", args = {"percent"}},
  [39] = {name = "Nullify attack restriction", args = {"enum.state"}},
  [40] = {name = "Reduce terrain effects", args = {"percent"}},
  -- 41 used for Nutaku feng-shui, but not really clear
  --
  [43] = {name = "Skill attack change", args = {"_", "range", "missile"}},
  [44] = {name = "Mutex (ATK/DEF/Cost)", args = {"mutex"}},
  [45] = {name = "Skill cooldown timer reduction", args = {"percent"}},
  [46] = {name = "ATK flying mod", args = {"mod", "chance"}},
  [47] = {name = "Recover UP upon withdrawl", args = {"percent"}},
  [48] = {name = "Assassinate (add)", args = {"add_percent"}},
  [49] = {name = "Low HP DEF bonus", args = {k_threshold_percent, "add_percent"}},
  [50] = {name = "Nearby status ailment recovery rate", args = {"percent"}},
  [51] = {name = "Tokenize", args = {"_", "filter"}},
  [52] = {name = "Mutex (HP)", args = {"mutex"}},
  [53] = {name = "Mutex (skill duration)", args = {"mutex"}},
  --
  [55] = {name = "Token count mod", args = {"n"}},
  [56] = {name = "Area attack", args = {"chance", "_", "range"}}, -- 60?
  [57] = {name = "Drop boost (affection gift)", args = {"add_percent"}},
  [58] = {name = "Drop boost (trust gift)", args = {"add_percent"}},
  [59] = {name = "Drop boost (demon crystal)", args = {"add_percent"}},
  [60] = {name = "Drop boost (armor)", args = {"add_percent"}},
  [61] = {name = "Drop boost (spirit)", args = {"add_percent"}},
  [62] = {name = "Skill initial timer mod", args = {"percent", "filter"}},
  --
  [64] = {name = "(Deprecated?) Enemy type filter", args = {"enum.enemy_type"}}, -- I believe the skill now handles this (Enchanter, Sukuha)
  [65] = {name = "Can't be healed"},
  [66] = {name = "Reincarnate", args = {"_", "delay"}}, -- 100?
  [67] = {name = "Reincarnate (regeneration)", args = {"n", "delay"}},
  --
  [69] = {name = "Cost increase", args = {"n"}}, -- 1?
  [70] = {name = "ATK mod (new)", args = {"percent", "_", "_", "mutex"}},
  [71] = {name = "DEF mod (new)", args = {"percent", "_", "_", "mutex"}},
  [72] = {name = "Command"},
  -- 73 AW Prince = 100, WE
  -- 74 AW Prince = 100, WE
  -- 75 AW Prince = 100, WE
  [76] = {name = "MR mod (new)", args = {"add_n", "_", "_", "mutex"}},
  --
  [78] = {name = "Gold boost", args = {"add_percent"}},
  [79] = {name = "Drop boost (silver)", args = {"add_percent"}},
  [80] = {name = "Drop boost (non-unit)", args = {"add_percent"}},
  [81] = {name = "Cost reduction (new)", args = {"n", "_", "_", "mutex"}},
  [82] = {name = "HP mod (new)", args = {"percent", "_", "_", "mutex"}},
  [83] = {name = "ATK mod (conditional)", args = {"percent"}},
  --
  [86] = {name = "Substitute own death for ally death"},
  [87] = {name = "HP mod (dynamic)", args = {"percent", "_", "_", "mutex.82"}},
  [88] = {name = "Gold GET! bonus", args = {"n"}},
  --
  [90] = {name = "Reduce enemy DEF on hit", args = {"percent", k_frames}},
  [91] = {name = "Reduce attack cooldown", args = {"percent", "_", "_", "mutex"}},
  [92] = {name = "Ranged target count", args = {"percent", "n"}}, -- ?
  --
  [97] = {name = "First unit doesn't count against deployment limit"},
  [98] = {name = "Degenerate HP", args = {"opt.n", "delay", "opt.percent"}},
  --
  [106] = {name = "Cost reduction (conditional)", args = {"_", "n"}},
  -- 107 Aoba
  [108] = {name = "Nekomata ATK penalty", args = k_nekomata},
  [109] = {name = "Nekomata DEF penalty", args = k_nekomata},
  --
  [110] = {name = "ATK mod per unit", args = {"percent", k_max_percent}},
  [111] = {name = "DEF mod per unit", args = {"percent", k_max_percent}},
  [112] = {name = "Makai adaptation (ATK)"},
  [113] = {name = "Makai adaptation (DEF)"},
  --
  [115] = {name = "Dancer attack bonus", args = {"percent", "_", "_", "mutex"}},
  [116] = {name = "Dancer defense bonus", args = {"percent", "_", "_", "mutex"}},
  --
  [119] = {name = "Reduce enemy HP", args = {"percent"}},
  [120] = {name = "Reduce enemy ATK", args = {"percent"}},
}

local enums = {
  priority = {
    [1] = "MAGIC",
    [2] = "RANGED",
  },
  state = {
    [1] = "IDLE",
    [2] = "DURING_SKILL",
    [3] = "NOT_DURING_SKILL",
  },
  weather = {
    [1] = "BLIZZARD",
  },
  gender = {
    [0] = "MALE",
    [1] = "FEMALE",
  },
  enemy_type = {
    [1] = "ARMOR",
    [2] = "DRAGON",
    [3] = "DEMON",
    [4] = "YOKAI",
    [5] = "GOLEM",
    [6] = "ANGEL",
    [7] = "MERMAN",
    [8] = "ORC",
    [9] = "GOBLIN",
  },
}

-- Invoke
-- 1: [Default] Instant Death Strike, Flaming War Spear, Rapid Fire, Priority Magic
-- 2: [Sortie] All Attack Up (S), Unit Points Up
-- 3: [Placement] Minor Heal
-- 4: [Deployed] Pursuit, Miracle Shield, Increased Evasion, Certain Kill Attack

-- Target
-- 1: [Self] Pursuit, Miracle Shield, Increased Evasion, Instant Death Strike, Certain Kill Attack, Flaming War Spear, Rapid Fire
-- 2: [All] Minor Heal, All Attack Up (S), Unit Points Up

local invoke_lookup = {
  [0] = "[Default]",
  [1] = "[Inherent]",
  [2] = "[Sortie]",
  [3] = "[Placement]",
  [4] = "[Deployed]",
}

local target_lookup = {
  [0] = "[Default]",
  [1] = "[Self]",
  [2] = "[All]",
}

local parse_config

local function parse(id)
  local out = ""
  local ability = abilities[id + 1]
  assert(ability.AbilityID == id)
  out = out .. "Ability Name: " .. ability.AbilityName .. "\n"
  out = out .. "(Deprecated?) Ability Power: " .. ability.AbilityPower .. "; Ability Type: " .. ability.AbilityType .. "\n"
  local text_id = ability.AbilityTextID
  local description = ability_text[text_id + 1]
  out = out .. "Description:\n\t" .. description.AbilityText:gsub("\n", "\n\t") .. "\n"
  local config_id = ability._ConfigID
  if config_id == 0 then
    out = out .. "Influences: (none)\n"
  else
    out = out .. parse_config(config_id)
  end
  return out
end

function parse_config(id)
  local out = ""
  local influence_records = {}
  local found = false
  for _, influence in ipairs(configs) do
    if influence._ConfigID == id or found and influence._ConfigID == 0 then
      found = true
      table.insert(influence_records, influence)
    elseif found then
      break
    end
  end
  out = out .. "Config ID: " .. id .. "\n"
  if #influence_records > 0 then
    out = out .. "Influences:\n"
    for _, influence in ipairs(influence_records) do
      local params = table.concat({influence._Param1, influence._Param2, influence._Param3, influence._Param4}, "/")
      local itype = influence._InfluenceType
      local info = influence_lookup[itype]
      local post = {}
      if info then
        out = out .. "\t" .. info.name .. " (" .. itype .. "):"
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
            local param = influence["_Param" .. i]
            if arg == "_" or opt and param == 0 then
              -- nothing
            elseif arg == "n" then
              str = param
            elseif arg == "range" then
              str = param .. " range"
            elseif arg == "add_n" then
              if param < 0 then
                str = param
              else
                str = "+" .. param
              end
            elseif arg == "mod" then
              str = "x" .. (param/100)
            elseif arg == "chance" then
              str = param .. "% chance"
            elseif arg == "percent" then
              str = param .. "%"
            elseif arg == "add_percent" then
              if param < 0 then
                str = param .. "%"
              else
                str = "+" .. param .. "%"
              end
            elseif arg == "delay" then
              str = param .. " frame delay"
            elseif arg == "class" then
              if param == 0 then
                -- nothing
              else
                str = class.get_name_p(param)
              end
            elseif arg == "missile" then
              --str = "missile " .. param
              local mis_str = missile.parse(param)
              table.insert(post, mis_str)
            elseif arg:match("^mutex") then
              local id = itype
              local id_str = arg:match("%.(%d+)")
              if id_str then
                id = assert(tonumber(id_str))
              end
              str = "mutex " .. id .. ":" .. param
            elseif arg == "filter" then
              local param2 = influence["_Param" .. (i + 1)]
              local param3 = influence["_Param" .. (i + 2)]
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
        out = out .. "\tID " .. itype .. ":"
      end
      out = out .. " (" .. params .. ")\n"
      for _, str in ipairs(post) do
        out = out .. "\t  Detail:\n"
        out = out .. "\t    " .. str:gsub("\n(.)", "\n\t    %1")
      end
      local invoke = influence._InvokeType
      local target = influence._TargetType
      invoke = invoke_lookup[invoke] or invoke
      target = target_lookup[target] or target
      out = out .. "\t  Invoke: " .. invoke .. "; Target: " .. target .. "\n"
      
      local function add_notes(command)
        for classes in command:gmatch("IsClassType%(([%d,%s]+)%)") do
          for id in classes:gmatch("%d+") do
            id = assert(tonumber(id))
            out = out .. "\t    Note: class " .. id .. " is \"" .. class.get_name_p(id) .. "\"\n"
          end
        end
        for cards in command:gmatch("IsCardID%(([%d,%s]+)%)") do
          for id in cards:gmatch("%d+") do
            id = assert(tonumber(id))
            out = out .. "\t    Note: card " .. id .. " is \"" .. unit.get_name(id) .. "\"\n"
          end
        end
        for gender in command:gmatch("GetGender%(%)%s*%=%=%s*(%d+)") do
          gender = assert(tonumber(gender))
          if enums.gender[gender] then
            out = out .. "\t    Note: gender " .. gender .. " is " .. enums.gender[gender] .. "\n"
          end
        end
        for rare in command:gmatch("IsRaryty%((%d+)%)") do
          rare = assert(tonumber(rare))
          out = out .. "\t    Note: rarity " .. rare .. " is \"" .. rarity.get_name(rare) .. "\"\n"
        end
        if command:match("GetClassID%(%)%s*%<%s*10000") then
          out = out .. "\t    Note: classes less than 10000 are melee classes\n"
        end
        if command:match("GetClassID%(%)%s*%>%=%s*10000") then
          out = out .. "\t    Note: classes greater than or equal to 10000 are ranged classes\n"
        end
      end
      
      if influence._Command and influence._Command ~= "" then
        out = out .. "\t  Command: " .. influence._Command .. "\n"
        add_notes(influence._Command)
      end
      if influence._ActivateCommand and influence._ActivateCommand ~= "" then
        out = out .. "\t  Command (Activate): " .. influence._ActivateCommand .. "\n"
        add_notes(influence._ActivateCommand)
      end
      if stop then
        break
      end
    end
  end
  return out
end

return {
  parse = parse,
  parse_config = parse_config,
}
