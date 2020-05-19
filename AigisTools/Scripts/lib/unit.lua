local dl = require("lib/download")
local parse_al = require("lib/parse_al")
local output_al = require("lib/output_al")
local xml = require("lib/xml")
local xmldoc = require("lib/xmldoc")
local file = require("lib/file")

local class = require("lib/class")
local rarity = require("lib/rarity")
local format = require("lib/format")
local stat = require("lib/stat")
local missile = require("lib/missile")
local skill = nil -- defer
local ability = nil -- defer

local class_lib = class

local names = dl.getfile(nil, "NameText.atb")
names = parse_al.parse(names)
names = parse_al.totable(names)

local status = dl.getfile(nil, "StatusText.atb")
status = parse_al.parse(status)
status = parse_al.totable(status)

local tokens = dl.getfile(nil, "TokenUnitConfig.atb")
tokens = parse_al.parse(tokens)
tokens = parse_al.totable(tokens)

local specialty = dl.getfile(nil, "UnitSpecialty.atb")
specialty = parse_al.parse(specialty)
specialty = parse_al.totable(specialty)

local cards = nil
local info = nil

local max_level = {
  [0] = 30,
  [1] = 40,
}

local max_cc_level = {
  [2] = 50,
  [3] = 60,
  [4] = 70,
  [7] = 65,
}

local max_aw_level = {
  [3] = 80,
  [4] = 90,
  [7] = 85,
}

local affbonus = {
  [1] = "HP",
  [2] = "ATK",
  [3] = "DEF",
  [4] = "Range",
  [6] = "Speed",
}

local art_suffix = {
  [0] = "",
  [1] = "_AW",
  [2] = "_AW2A",
  [3] = "_AW2B",
}

local k_cc_max = 4
local k_art_max = 3

local special_influence_lookup = {
  [1] = {name = "Blizzard resist", args = {"percent"}},
  [2] = {name = "(Weather 2) resist", args = {"percent"}},
  [3] = {name = "(Weather 3) resist", args = {"percent"}},
  -- 4 used on star rush / farm units
  -- 5 used on star rush / farm units
  [6] = {name = "Drop boost (gold rush platinums)", args = {"flag", "percent"}},
  --
  [9] = {name = "Unknown (spirit queen 1)", args = {"flag"}},
  --
  [11] = {name = "Unknown (spirit queen 2)", args = {"flag"}},
  [12] = {name = "Unknown (vampire)"}, -- I did double check that the real duration is indeed 12 seconds...
  -- 13 used on trap / calamity mirror / prism mirror / mist clone, etc
  [14] = {name = "Reduce enemy DEF on hit", args = {"percent", "format.%1 frames (pre-CC)", "format.%1 frames (CC)", "format.%1 frames (AW)"}},
  -- 15 used on trap
  [16] = {name = "Cannot be targeted", args = {"flag"}},
  -- 17 used on trap
  --
  -- 23 used on trap / steam tank
  --
  [25] = {name = "(Deprecated?) Maid ATK mod", args = {"format.%1% (pre-AW)", "format.%1% (AW)"}},
  [26] = {name = "(Deprecated?) Maid DEF mod", args = {"format.%1% (pre-AW)", "format.%1% (AW)"}},
  [27] = {name = "(Deprecated?) Maid cost reduction", args = {"format.%1 (pre-AW)", "format.%1 (AW)"}},
  --
  [31] = {name = "Unit combination wildcard", args = {"flag"}},
  --
  -- 33 used on star rush / farm units
  [34] = {name = "Command"},
}

local function affection(t, n, full)
  t = affbonus[t]
  if t == nil and t >= 1 then -- this is broke
    t = "T=" .. t
  end
  if t == nil then return nil end
  if not full then
    n = math.floor(n * .5 + .5)
  else
    n = math.floor(n * 1.2 + .5)
  end
  return t .. " +" .. n
end

local initialized = false
local function initialize()
  if not initialized then
    cards = xmldoc.getfile(nil, "cards")
    cards = xml.parse(cards)
    cards = xml.totable(cards)
    
    info = {}
    for _, card in ipairs(cards) do
      local id = card.CardID
      info[id] = {
        card = card,
        name = names[id] or ("Unit " .. id)
      }
    end
    
    for _, token_config in ipairs(tokens) do
      local id = token_config.Param_SummonUnit
      if info[id] then
        info[id].token = true
      end
    end
    
    skill = require("lib/skill")
    ability = require("lib/ability")
    
    initialized = true
  end
end

local icon_initialized = false
local ico = nil
local function icon_initialize()
  if not icon_initialized then
    ico = {}
    for i = 0, k_art_max do
      local file_name = string.format("ico_%02d.aar", i)
      if dl.listhasfile(nil, file_name) then
        ico[i] = dl.getfile(nil, file_name)
        ico[i] = parse_al.parse(ico[i])
      end
    end
    icon_initialized = true
  end
end

local function exists(id)
  return names[id] and names[id].Message ~= "-"
end

local function get_name(id)
  local name = names[id]
  if name and name.Message ~= "-" then
    return name.Message .. " (" .. id .. ")"
  else
    return "Unit " .. id
  end
end

local function has_name(id)
  local name = names[id]
  return name and name.Message ~= "-"
end

local function get_classes(id)
  
  initialize()
  
  local my_info = info[id]
  
  if not my_info.classes then
    local card = my_info.card
    local base_class = class.get(card.InitClassID)
    
    local classes = {base_class}
    local current_class = base_class
    while current_class.JobChange ~= 0 or current_class.AwakeType1 and current_class.AwakeType1 ~= 0 do
      if current_class.AwakeType1 and current_class.AwakeType1 ~= 0 then
        if card._AwakePattern == 1 or card._AwakePattern == 3 then
          local awclass = class.get(current_class.AwakeType1)
          table.insert(classes, awclass)
        end
        if card._AwakePattern == 2 or card._AwakePattern == 3 then
          local awclass = class.get(current_class.AwakeType2)
          table.insert(classes, awclass)
        end
        break
      elseif current_class.JobChange ~= 0 then
        current_class = class.get(current_class.JobChange)
        table.insert(classes, current_class)
      else
        error()
      end
    end
  
    for i = 1, #classes do
      local current_class = classes[i]
      local cc = current_class.DotNo
      if card.Rare <= 1 and cc >= 1 then
        classes[i] = nil
      end
      if card.Rare <= 2 and cc >= 2 then
        classes[i] = nil
      end
    end
    my_info.classes = classes
  end
  return my_info.classes
end

local function get_interesting_levels(id, class)
  initialize()
  
  local cc = class.DotNo
  local card = info[id].card
  local levels = {1}
  if info[id].token then
    for _, level in ipairs{50, 55, 60, 65, 70, 80, 85, 90, 99} do
      if level <= class.MaxLevel then
        table.insert(levels, level)
      end
    end
  elseif cc == 0 then
    local maxlevel = math.min(class.MaxLevel, max_level[card.Rare] or class.MaxLevel)
    table.insert(levels, maxlevel)
  elseif cc == 1 then
    local maxlevel = math.min(class.MaxLevel, max_cc_level[card.Rare] or class.MaxLevel)
    table.insert(levels, maxlevel)
    if card.Rare == 2 and maxlevel == 50 then
      -- include both 50 and 55 for silver
      table.insert(levels, 55)
    end
  elseif cc == 2 then
    local maxlevel = math.min(class.MaxLevel, max_aw_level[card.Rare] or class.MaxLevel)
    table.insert(levels, maxlevel)
  else
    -- no max for second awakening
    table.insert(levels, class.MaxLevel)
  end
  return levels
end

local function get_stats(id, cc, level)
  initialize()
  
  local classes = get_classes(id)
  local card = info[id].card
  
  for _, class in ipairs(classes) do
    if class.DotNo == cc and level <= class.MaxLevel then
      local rtn = {}
      rtn.hp, rtn.hpa, rtn.hpb = stat.get(level, class.MaxLevel, card.MaxHPMod, class.InitHP, class.MaxHP)
      rtn.atk, rtn.atka, rtn.atkb = stat.get(level, class.MaxLevel, card.AtkMod, class.InitAtk, class.MaxAtk)
      rtn.def, rtn.defa, rtn.defb = stat.get(level, class.MaxLevel, card.DefMod, class.InitDef, class.MaxDef)
      return rtn, class
    end
  end
  
  return nil
end

local function get_info(id, params)
  initialize()
  local inf = info[id]
  if inf then
    for _, param in ipairs(params or {}) do
      params[param] = true
    end
    local card = inf.card
    inf.battle_style = class.get_battle_style((card.InitClassID // 100) * 100)
    if params.class then
      inf.classes = get_classes(id)
    end
    if params.dot then
      if not inf.dot then
        local dot_archives = {}
        local dot = {}
        local pattern = {}
        for i = 0, k_cc_max do
          local dot_id = card["DotID" .. i]
          if dot_id == nil or dot_id == 0 then
            dot_id = card.CardID
          end
          if not dot_archives[dot_id] then
            local file_name = string.format("PlayerDot%04d.aar", dot_id)
            if dl.listhasfile(nil, file_name) then
              local dot_arch = dl.getfile(nil, file_name)
              dot_arch = parse_al.parse(dot_arch)
              dot_archives[dot_id] = dot_arch
            end
          end
          dot[i] = dot_archives[dot_id]
          pattern[i] = (0x35000 + i * 10000 + dot_id) << 4
        end
        inf.dot = dot
        inf.pattern = pattern
      end
    end
  end
  return inf
end

local function parse(id)
  get_info(id, {"dot"})
  if info[id] == nil then
    return "Unit " .. id .. " is not found"
  end
  local card = info[id].card
  local name = get_name(id)
  local out = ""
  out = out .. "Name: " .. name .. "\n"
  
  -- categorization
  out = out .. "Rarity: " .. rarity.get_name(card.Rare) .. "\n"
  out = out .. "Gender: " .. format.gender(card.Kind) .. "\n\n"
  
  -- overall parameters
  out = out .. "Magic resistance (base): " .. card.MagicResistance .. "\n"
  
  local battle_style = info[id].battle_style
  local battle_style_range = {}
  if battle_style then
    out = out .. "Class battle style: " .. battle_style.Type_BattleStyle .. "\n"
    if battle_style._Param_01 ~= 0 then
      out = out .. "Class parameter 1: " .. battle_style._Param_01 .. "\n"
    end
    if battle_style._Param_02 ~= 0 then
      out = out .. "Class parameter 2: " .. battle_style._Param_02 .. "\n"
    end
    for i = 0, k_cc_max do
      battle_style_range[i] = battle_style[string.format("_Range_%02d", i + 1)]
    end
  end
  
  out = out .. "\n"
  out = out .. "Gold value (discharge): " .. card.SellPrice .. "; Rainbow crystal value (discharge): " .. card._TradePoint .. "\n"
  out = out .. "EXP value (combine): " .. card.BuildExp .. "\n\n"
  
  local function handle_class(class, cc, has_next)
    local ranged = class.ClassID >= 10000
    
    out = out .. "Class: " .. class.Name .. " (" .. cc .. ")\n"
    out = out .. "Description:\n\t" .. format.indent(class.Explanation) .. "\n"
    out = out .. "Ranged: " .. (ranged and "yes" or "no") .. "\n"
    if not ranged then
      out = out .. "Block count: " .. class.BlockNum .. "\n"
      if battle_style_range[cc] and battle_style_range[cc] ~= 0 then
        out = out .. "Range: " .. battle_style_range[cc] .. "\n"
      end
    else
      out = out .. "Range: " .. class.AtkArea .. "\n"
    end
    out = out .. "Target/attack count: " .. class.MaxTarget .. "\n"
    out = out .. "Attack attribute: " .. format.get_enum("attack_attribute", class.AttackAttribute) .. "\n"
    out = out .. "EXP value per level (combination): " .. class.BuildExp .. "\n"
    out = out .. "\n"
    
    if class.ClassAbility1 ~= 0 then
      out = out .. "Class ability:\n\t"
      out = out .. format.indent(ability.parse_config(class.ClassAbility1))
    end
    
    out = out .. "\n"
    
    if ranged then
      out = out .. missile.parse(class.MissileID) .. "\n"
    end
    
    local levels = get_interesting_levels(id, class)
    
    out = out .. "Stats (HP, ATK, DEF):\n"
    for _, level in ipairs(levels) do
      local hp, hpa = stat.get(level, class.MaxLevel, card.MaxHPMod, class.InitHP, class.MaxHP)
      local atk, atka = stat.get(level, class.MaxLevel, card.AtkMod, class.InitAtk, class.MaxAtk)
      local def, defa = stat.get(level, class.MaxLevel, card.DefMod, class.InitDef, class.MaxDef)
      out = out .. string.format("Lv%02d  %7s %6s %6s\n", level, hp .. hpa, atk .. atka, def .. defa)
    end
    out = out .. "\n"
    out = out .. "Max cost: " .. (class.Cost + card.CostModValue) .. "; Min cost: " .. (class.Cost + card.CostModValue - card.CostDecValue) .. "\n"
    
    local aff_bonuses = {}
    local full_affection_bonus = class.MaxLevel > 50 -- maybe not the true condition...
    if card.BonusType ~= 0 then
      table.insert(aff_bonuses, affection(card.BonusType, card.BonusNum, full_affection_bonus))
    end
    if card.BonusType2 ~= 0 then
      table.insert(aff_bonuses, affection(card.BonusType2, card.BonusNum2, full_affection_bonus))
    end
    if card.BonusType3 ~= 0 then
      table.insert(aff_bonuses, affection(card.BonusType3, card.BonusNum3, full_affection_bonus))
    end
    if #aff_bonuses > 0 then
      out = out .. "Affection bonus(es): " .. table.concat(aff_bonuses, "; ") .. "\n"
    end
    out = out .. "\n"
    
    -- animation info
    local animations = {}
    local unit_pattern = info[id].pattern[cc]
    for _, archfile in ipairs(info[id].dot[cc]) do
      if archfile.name:match("%.aod$") then
        local aod = archfile.value
        local pattern = aod.mt and aod.mt.pattern
        if pattern then
          pattern = pattern & ~0xf
          if pattern == unit_pattern then
            animations[archfile.name] = aod
          end
        end
      end
    end
    
    for _, anim_name in ipairs{"Attack.aod", "Atk2.aod"} do
      local anim = animations[anim_name]
      if anim then
        local n = anim_name:match("%P+")
        local anim_len = anim.mt.length
        local attack_frame = class.AttackAnimNo
        out = out .. n .. ":" .. (" "):rep(7 - #n) .. format.pad("(" .. anim_len, 4) .. "+1) + " .. format.pad("(" .. class.AttackWait, 4) .. "+1) = " .. format.pad(anim_len + class.AttackWait + 2, 3) .. "\n"
       
        if anim.mt.entries[1].data.PatternNo[1 + attack_frame] then
          local attack_time = anim.mt.entries[1].data.PatternNo[1 + attack_frame].time -- +1 is Lua-indexing offset
          out = out .. "Initial: (" .. attack_time .. "+1)           = " .. format.pad(attack_time + 1, 3) .. "\n"
        else
          out = out .. "Initial: (bad) frame " .. attack_frame .. "\n"
        end
        
        out = out .. "Timing:  " .. anim.mt.entries[1].data.PatternNo[1].time
        for i = 2, #anim.mt.entries[1].data.PatternNo do
          out = out .. " / " .. anim.mt.entries[1].data.PatternNo[i].time
        end
        out = out .. "\n\n"
      end
    end
    
    -- tokens
    for _, token_config in ipairs(tokens) do
      if token_config.ID_Class == class.ClassID then
        if token_config.Param_CardID == 0 or token_config.Param_CardID == card.CardID then
          out = out .. "Token: " .. get_name(token_config.Param_SummonUnit) .. "\n"
          out = out .. "Token cost: " .. token_config.Param_SummonCost .. "\n"
          out = out .. "Token count: " .. token_config.Param_SummonLimit .. "\n"
          out = out .. "Token deploy limit: " .. token_config.Param_SummonMax .. "\n"
          out = out .. "Token deploy cooldown: " .. token_config.Param_SummonRecast .. "\n\n"
        end
      end
    end
    
    -- class change/awakening materials
    if has_next and class.JobChange ~= 0 then
      out = out .. "Class change materials:\n"
      for i = 1, 3 do
        local material = class["JobChangeMaterial" .. i]
        if material ~= 0 then
          local mat_class = class_lib.get(material)
          out = out .. "\t" .. mat_class.Name .. "\n"
        end
      end
      for i = 1, 2 do
        local orb = class["Data_ExtraAwakeOrb" .. i]
        if orb ~= 0 then
          local orb_class = class_lib.get(orb)
          out = out .. "\t" .. orb_class.Name .. " Orb\n"
        end
      end
      out = out .. "\n"
    end
    
  end
  
  local classes = get_classes(id)
  
  for i, current_class in ipairs(classes) do
    local has_next = classes[i + 1] ~= nil
    local cc = current_class.DotNo
    handle_class(current_class, cc, has_next)
  end
  
  if card.ClassLV0SkillID ~= 0 then
    out = out .. "Base skill:\n\n"
    out = out .. skill.parse(card.ClassLV0SkillID) .. "\n"
  end
  
  if card.ClassLV1SkillID ~= 0 and card.ClassLV1SkillID ~= card.ClassLV0SkillID then
    out = out .. "Class-evolved skill:\n\n"
    out = out .. skill.parse(card.ClassLV1SkillID) .. "\n"
  end
  
  if card.EvoSkillID ~= 0 and card.EvoSkillID ~= card.ClassLV1SkillID then
    out = out .. "Awakened skill:\n\n"
    out = out .. skill.parse(card.EvoSkillID) .. "\n"
  end
  
  if card.Ability_Default ~= 0 then
    out = out .. "Non-awakened ability:\n\n"
    out = out .. ability.parse(card.Ability_Default) .. "\n"
  end
  
  if card.Ability ~= 0 then
    if card._AppearAbilityLevel ~= 0 then
      out = out .. "Level " .. card._AppearAbilityLevel .. " ability:\n\n"
    else
      out = out .. "Awakened ability:\n\n"
    end
    out = out .. ability.parse(card.Ability) .. "\n"
  end
  
  local special_influences = {}
  local found = false
  for _, special in ipairs(specialty) do
    if special.ID_Card == 0 and found or special.ID_Card == card.CardID then
      found = true
      table.insert(special_influences, special)
    elseif found then
      break
    end
  end
  
  if #special_influences > 0 then
    out = out .. "Special properties:\n"
    for _, influence in ipairs(special_influences) do
      local params = {
        influence.Value_Specialty,
        influence.Value_Param1, influence.Value_Param2,
        influence.Value_Param3, influence.Value_Param4,
      }
      out = out .. "\t" .. format.indent(format.format(special_influence_lookup, influence.Type_Specialty, params))
      if influence.Command and influence.Command ~= "" then
        out = out .. "\t  Command: " .. influence.Command .. "\n"
        local notes = format.get_notes(influence.Command)
        if notes ~= "" then
          out = out .. "\t  " .. format.indent(notes, "\t  ")
        end
      end
    end
    out = out .. "\n"
  end
  
  if card.LoveEv1 ~= 0 then
    out = out .. "Quotes:\n"
    local loves = {0, math.floor(card.LoveEv1 / 2), card.LoveEv1, 50, 60, 80, 100}
    for i, love in ipairs(loves) do
      out = out .. format.pad(love, 3) .. "%: " .. tostring(status[card.Flavor + i].Message):gsub("%s+", " ") .. "\n"
    end
  else
    out = out .. "Quote: " .. tostring(status[card.Flavor + 1].Message):gsub("%s+", " ") .. "\n"
  end
  
  if card.Illust ~= 0 then
    out = out .. "\nArtist: " .. tostring(status[card.Illust + 1].Message) .. "\n"
  end
  
  return out
end

local function dump(id, out, working)
  out = out .. string.format("%03d", id)
  local name = get_name(id)
  local is_english = true
  for i = 1, #name do
    if string.byte(name, i) >= 128 then
      is_english = false
      break
    end
  end
  if is_english then
    out = out .. "_" .. name:gsub(" ", "_")
  end
  if not file.dir_exists(out) then
    file.make_dir(out)
  end
  out = out .. "/"
  local text = parse(id)
  local h = assert(io.open(out .. "info.txt", 'w'))
  assert(h:write(text))
  assert(h:close())
  
  local function output_png(listname, filename)
    if dl.listhasfile(nil, listname) then
      local image = dl.getfile(nil, listname)
      local h = assert(io.open(out .. filename .. ".png", 'wb'))
      assert(h:write(image))
      assert(h:close())
    end
  end
  
  for i = 0, k_art_max do
    output_png(string.format("%03d_card_%d.png", id, i), "render" .. art_suffix[i])
  end
  
  if info[id] and info[id].dot then
    for cc = 0, k_cc_max do
      if info[id].dot[cc] then
        for _, f in ipairs(info[id].dot[cc]) do
          local aod = f.value
          local pattern = aod.mt and aod.mt.pattern
          if pattern then
            local aod_id = pattern & 0xf
            pattern = pattern & ~0xf
            --print(pattern, unit_pattern)
            if pattern == info[id].pattern[cc] then
              output_al.output(f.value, out .. string.format("dot%d\\%02d_%s\\", cc, aod_id, f.name), working, {textures = info[id].dot[cc].textures})
            end
          end
        end
      end
    end
  end
  
  icon_initialize()
  for i = 0, k_art_max do
    if ico[i] then
      for _, f in ipairs(ico[i]) do
        if f.name:match("%.atx$") then
          local get_frame = {
            index = id,
            name = "icon" .. art_suffix[i],
          }
          output_al.output(f.value, out, working, {get_frame = get_frame})
        end
      end
    end
  end
end

local function get_count()
  initialize()
  return #cards
end

return {
  exists = exists,
  get_name = get_name,
  has_name = has_name,
  get_info = get_info,
  parse = parse,
  dump = dump,
  get_stats = get_stats,
  get_interesting_levels = get_interesting_levels,
  get_count = get_count,
  
  k_cc_max = k_cc_max,
}
