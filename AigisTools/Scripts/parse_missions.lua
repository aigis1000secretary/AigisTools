-- parse_missions.lua
-- v1.1
-- author: lzlis

local dl = require("lib/download")
local xmldoc = require("lib/xmldoc")
local xml = require("lib/xml")
local parse_al = require("lib/parse_al")

local format = require("lib/format")
local unit = require("lib/unit")

local text = xmldoc.getfile(nil, "missions")
local obj = xml.parse(text)

local da = obj.contents

local count = #da[1].contents

local missions = {}

local nums = {}

for i = 1, count do
  local mission = {}
  for _, elt in ipairs(da) do
    mission[elt.tag] = tonumber(elt.contents[i].contents)
  end
  missions[i] = mission
end

text = dl.getfile(nil, "QuestNameText.atb")
local nametext = parse_al.parse(text)

for _, mission in ipairs(missions) do
  local titleid = mission.QuestTitle
  mission._name = nametext[titleid + 1] and tostring(nametext[titleid + 1][1].v) or "(unknown)"
  if mission._name == nil then
    mission._name = "(nil)"
  elseif #mission._name == 0 then
    mission._name = "(none)"
  end
end

text = dl.getfile(nil, "NameText.atb")
local unitnames = parse_al.parse(text)

text = dl.getfile(nil, "Enemy.atb")
local enemies = parse_al.parse(text)

text = dl.getfile(nil, "MessageText.atb")
local messages = parse_al.parse(text)
message = parse_al.totable(messages)

text = dl.getfile(nil, "QuestGuestUnitConfig.atb")
local guests = parse_al.parse(text)
guests = parse_al.totable(guests)

local guest_lookup = {}
for _, guest in ipairs(guests) do
  local qid = guest.ID_Quest
  local guests = guest_lookup[qid] or {}
  guest_lookup[qid] = guests
  table.insert(guests, guest)
end

text = dl.getfile(nil, "QuestTermConfig.atb")
local term_config = parse_al.parse(text)
term_config = parse_al.totable(term_config)

local terms = {}

local config_id = 0
for _, config in ipairs(term_config) do
  local id = config.ID_Config
  if id ~= 0 then
    config_id = id
  end
  assert(config_id ~= 0)
  local term = terms[config_id] or {}
  terms[config_id] = term
  table.insert(term, config)
end

local term_influence_lookup = {
  [2] = {name = "No healers", args = {"flag"}},
  [8] = {name = "Periodic HP loss to allies", args = {"_", "n", "delay"}},
  [9] = {name = "Initial HP reduction", args = {"percent"}},
  [11] = {name = "Enemy DEF mod", args = {"percent"}},
  [12] = {name = "Enemy movement speed mod", args = {"percent"}},
  [13] = {name = "Ally ATK mod", args = {"percent"}}, -- maybe swapped with 14?
  [14] = {name = "Ally DEF mod", args = {"percent"}}, -- maybe swapped with 13? 
  [15] = {name = "Enemy size mod", args = {"percent"}},
  [16] = {name = "Ally size mod", args = {"percent"}},
  [17] = {name = "Unit points don't regenerate"},
  [18] = {name = "Enemy ATK mod", args = {"percent"}},
  [19] = {name = "Enemy range mod", args = {"percent"}},
  [20] = {name = "Enemy HP mod", args = {"percent"}},
  [21] = {name = "Enemy MR mod", args = {"percent"}},
  [22] = {name = "Ally magic damage mod", args = {"percent"}},
  [24] = {name = "Allowed unit restriction"},
  [25] = {name = "Ally cost mod", args = {"percent"}},
}

local term_text = {}

for term_id, term in pairs(terms) do
  local text = "Term properties: (term " .. term_id .. ")\n"
  for _, config in ipairs(term) do
    text = text .. "\t" .. format.format(term_influence_lookup, config.Type_Influence, {config.Data_Param1, config.Data_Param2, config.Data_Param3, config.Data_Param4})
    if config.Data_Expression and config.Data_Expression ~= "" then
      text = text .. "\t  Expression: " .. config.Data_Expression .. "\n"
      local notes = format.get_notes(config.Data_Expression)
      if notes ~= "" then
        text = text .. "\t  " .. format.indent(notes, "\t  ")
      end
    end
  end
  term_text[term_id] = text
end

-- legacy enemy names
h = assert(io.open("Data\\meta\\enemy_names.txt", "r"))
text = assert(h:read("*a"))
assert(h:close())

local idx = 1
for name in text:gmatch("(%C*)\n\r?") do
  --print(idx, name)
  if not enemies[idx] then enemies[idx] = {} end
  if #name > 0 then
    enemies[idx]._name = name
  end
  idx = idx + 1
--  if idx > #enemies then break end
end

local enemygfx_names = {}
h = assert(io.open("Data\\meta\\enemy_gfx.txt", "r"))
text = assert(h:read("*a"))
assert(h:close())

for name in text:gmatch("(%C*)\n\r?") do
  --print(name)
  table.insert(enemygfx_names, name)
end

local available_maps = {}

local files = dl.getlist_raw()

for mapn in files:gmatch("Map(%d+)%.aar") do
  mapn = tonumber(mapn, 10)
  assert(mapn)
  assert(not available_maps[mapn])
  available_maps[mapn] = true
end

local mission_types = {
  "TutorialMission",
  "StoryMission",
  "ChallengeMission",
  "DailyMission",
  "HarlemMission",
  "EmergencyMission",
  "ReproduceMission",
  "SubjugationMission",
  "DevilAdventMission",
  "RaidMission",
  "TowerMission",
  "AssaultMission",
}

local mission_alt = {
  "DailyReproduceMission",
}

local treasure_decode = {
  [1001] = "Bouquet",
  [1002] = "Crystal",
  [1003] = "Ruby",
  [1004] = "Diamond",
  [1005] = "Beer",
  [1006] = "Table Wine",
  [1007] = "Choice Sake",
  [1008] = "Millennium Wine",
  [2001] = "Demon Crystal",
  [2002] = "2x Demon Crystals",
  [2003] = "3x Demon Crystals",
  [4001] = "Soldier Chief Orb",
  [4002] = "Battle Master Orb",
  [4003] = "Unicorn Knight Orb",
  [4004] = "Assassin Orb",
  [4005] = "Berserker Orb",
  [4006] = "Samurai Master Orb",
  [4007] = "Ninja Master Orb",
  [4008] = "Pegasus Knight Orb",
  [4009] = "Dark Knight Orb",
  [4010] = "Master Monk Orb",
  [4011] = "Advance Strategist Orb",
  [4012] = "Rune Fencer Orb",
  [4013] = "Sniper Orb",
  [4014] = "Warlock Orb",
  [4015] = "Priestess Orb",
  [4016] = "Lode Witch Orb",
  [4017] = "Captain Orb",
  [4018] = "Vampire Killer Orb",
  [4019] = "High Shaman Orb",
  [4020] = "High Bishop Orb",
  [4021] = "Rear Strategist Orb",
  [4022] = "Arch Angel Orb",
  [4023] = "Sailor Chief Orb",
  [4024] = "Heavy Artillery Officer Orb",
  [4025] = "Feng Shui Master Orb",
  [4026] = "Battle Mage Orb",
  [4027] = "Priestess Warrior Leader Orb",
  [4028] = "Top Dancer Orb",
  [4030] = "Dragon Knight Orb",
  [4031] = "Master of Automata Orb",
  [4032] = "High Alchemist Orb",
  [4034] = "High Ranger Orb",
  [4035] = "Magician Orb",
}

local maps = {}
local entries = {}
local messagetexts = {}
local enemiesmap = {}
local battletalks = {}

local function handle_mission(mission, series, series_i, mtype)
  local mapn = tonumber(mission.MapNo)
  --if series then mapn = mapn + series // 100 end
  if available_maps[mapn] and not maps[mapn] then
    local mapname = string.format("Map%03d.aar", mapn)
    --[[if series and not dl.listhasfile(nil, mapname) then
      mapname = string.format("Map%01d%03d.aar", series // 100000, mapn)
    end]]
    text = dl.getfile(nil, mapname)
    local map = parse_al.parse(text)
    maps[mapn] = map
    entries[mapn] = {}
    for _, archfile in ipairs(map) do
      local entryn = archfile.name:match("Entry(%d+)%.atb")
      if entryn then
        entries[mapn][tonumber(entryn, 10)] = assert(archfile.value)
      end
    end
  end
  
  if series and not messagetexts[series] then
    local mt = "MessageText" .. series .. ".atb"
    if dl.listhasfile(nil, mt) then
      mt = dl.getfile(nil, mt)
      mt = parse_al.parse(mt)
      mt = parse_al.totable(mt)
      messagetexts[series] = mt
    end
  end
  local mt = series and messagetexts[series]
  
  if series and not enemiesmap[series] then
    local ene = "Enemy" .. series .. ".atb"
    if dl.listhasfile(nil, ene) then
      ene = dl.getfile(nil, ene)
      ene = parse_al.parse(ene)
      ene = parse_al.totable(ene)
      enemiesmap[series] = ene
    end
  end
  local ene = series and enemiesmap[series] or enemies
  
  if series and not battletalks[series] then
    local bt = "BattleTalkEvent" .. series .. ".atb"
    if dl.listhasfile(nil, bt) then
      bt = dl.getfile(nil, bt)
      bt = parse_al.parse(bt)
      bt = parse_al.totable(bt)
      battletalks[series] = bt
    end
  end
  local bt = series and battletalks[series]
  
  local map = maps[mapn]
  if map then
    local entryn = tonumber(mission.EntryNo)
    local entry = entries[mapn][entryn]
    if entry then
      local field_indices = {}
      for idx, field in ipairs(entry.header.object) do
        field_indices[field.name_en] = idx
      end
      local kEnemyID = assert(field_indices.EnemyID)
      local kLoop = assert(field_indices.Loop)
      local kLevel = assert(field_indices.Level)
      local kPrizeCardID = assert(field_indices.PrizeCardID)
      local kPrizeEnemyDropPercent = assert(field_indices.PrizeEnemyDropPercent)
      local kEntryCommand = assert(field_indices.EntryCommand)
      
      local mob_counts = {}
      local mob_min_levels = {}
      local mob_max_levels = {}
      local missing_mobs = {}
      local treasure_counts = {}
      local mob_level_counts = {}
      local enemy_total = 0
      local bonus_treasure = {}
      local dialog = {}
      
      for _, mob in ipairs(entry) do
        local wt, wlct = nil, nil
        if mtype == "SubjugationMission" then
          local wave = enemy_total // 100 + 1
          wt = mob_counts[wave] or {}
          --io.stderr:write("wave:",wave,"\n")
          mob_counts[wave] = wt
          
          wlct = mob_level_counts[wave] or {}
          mob_level_counts[wave] = wlct
        end
        local mob_counts = wt or mob_counts
        local mob_level_counts = wlct or mob_level_counts
        
        local id = mob[kEnemyID].v
        local skip_total = false
        if id >= 6000 and id <= 7999 then
          if id >= 7000 then
            skip_total = true -- optional replacement enemy
          end
          id = id % 1000
        end
        --if enemies[id] then
        if id >= 1 and id <= 999 then
          local count = mob_counts[id] or 0
          --assert(mob[kLoop].v > 0)
          count = count + mob[kLoop].v
          if not skip_total then
            enemy_total = enemy_total + mob[kLoop].v
          end
          mob_counts[id] = count
          local level_counts = mob_level_counts[id] or {}
          mob_level_counts[id] = level_counts
          level_counts[mob[kLevel].v] = (level_counts[mob[kLevel].v] or 0) + mob[kLoop].v
          if mob_min_levels[id] then
            mob_min_levels[id] = math.min(mob_min_levels[id], mob[kLevel].v)
            mob_max_levels[id] = math.max(mob_max_levels[id], mob[kLevel].v)
          else
            mob_min_levels[id] = mob[kLevel].v
            mob_max_levels[id] = mob[kLevel].v
          end
          --print("mob", id, enemies[id]._name)
        elseif id >= 1 and id <= 999 then
          io.stderr:write("unavailable enemy: " .. id .. "\n")
          missing_mobs[id] = true
        end
        if id >= 1 and id <= 999 then
          local treasure = mob[kPrizeCardID].v
          local bonus = mob[kPrizeEnemyDropPercent].v
          if bonus > 0 then
            table.insert(bonus_treasure, bonus)
          elseif treasure > 0 then
            local tcount = treasure_counts[treasure] or 0
            tcount = tcount + mob[kLoop].v
            treasure_counts[treasure] = tcount
          end
        end
        if id == 4201 then
          -- EntryCommand
          local command = mob[kEntryCommand].v
          if bt and command:match("^CallEvent%([%d, ]+%)%;$") then
            local offset = bt[1].RecordOffset
            local seq = {}
            for event in command:gmatch("%d+") do
              event = assert(tonumber(event)) - offset + 1
              local t = assert(bt[event])
              table.insert(seq, t.Name .. ": " .. t.Message:gsub("\n", " "):gsub(" +", " "))
            end
            if #seq > 0 then
              table.insert(dialog, seq)
            end
          end
        end
      end
      print((series and (series .. "/" ) or "")..mission.QuestID, mission._name, "Level = " .. mission.Level)
      print("map=" .. mission.MapNo, "entry=" .. mission.EntryNo, "location=" .. mission.LocationNo)
      if mission.AppearCondition ~= 0 then
        for _, p in ipairs(missions) do
          if p.QuestID == mission.AppearCondition then
            print("prerequisite=" .. p._name)
          end
        end
      end
      print("enemies=".. enemy_total, "cha="..mission.Charisma, "sta="..mission.ActionPoint)
      print("exp="..mission.RankExp, "gold="..mission.Gold)
      print("life="..mission.defHP, "startUP="..mission.defAP, "unitLimit="..mission.Capacity)
      if mission.QuestTerms ~= 0 then
        print("terms="..mission.QuestTerms)
        if term_text[mission.QuestTerms] then
          print(term_text[mission.QuestTerms])
        end
      end
      if mission._HardLevel ~= 0 or mission._HardCondition ~= 0 or mission._HardInfomation ~= 0 then
        print("hard="..mission._HardCondition, "HL="..mission._HardLevel)
        if mission._HardCondition ~= 0 and term_text[mission._HardCondition] then
          print(term_text[mission._HardCondition])
        end
        if mission._HardInfomation ~= 0 then
          local hi
          --[[
          if mt then
            hi = mt[mission._HardInfomation + 1].Message
          elseif messages and messages[mission._HardInfomation + 1] then
            hi = messages[mission._HardInfomation + 1][1].v
          else
            hi = "???"
          end
          print("hinfo="..string.format("%q", hi):gsub("\\\n", "\n"))
          ]]
        end
      end
      local quote
      if mt then
        if mt[mission.Text + 1] then
          quote = mt[mission.Text + 1].Message
        else
          quote = "???"
        end
      elseif messages and messages[mission.Text + 1] then
        quote = messages[mission.Text + 1][1].v
      else
        quote = "???"
      end
      print("quote="..string.format("%q", quote):gsub("\\\n", "\n"))
      for i = 1, 5 do
        local treasure_key = string.format("Treasure%d", i)
        local treasure = mission[treasure_key]
        local count = treasure_counts[i] or 0
        if treasure > 0 then
          local reward_name = tostring(treasure)
          if treasure >= 1 and treasure <= 999 and unitnames[treasure] then
            reward_name = unitnames[treasure][1].v .. " (" .. treasure .. ")"
          end
          if treasure_decode[treasure] then
            reward_name = treasure_decode[treasure]
          end
          print("Reward " .. i, reward_name, "x" .. count, "lv" .. mission.UnitLevel)
        end
      end
      for _, treasure in ipairs(bonus_treasure) do
        local reward_name = tostring(treasure)
        if treasure >= 1 and treasure <= 999 and unitnames[treasure] then
          reward_name = unitnames[treasure][1].v .. " (" .. treasure .. ")"
        end
        if treasure_decode[treasure] then
          reward_name = treasure_decode[treasure]
        end
        print("Reward X", reward_name)
      end
      local it_a, it_b, it_c = ipairs{mob_counts}
      if mtype == "SubjugationMission" then
        it_a, it_b, it_c = ipairs(mob_counts)
      end
      for wave, mob_counts in it_a, it_b, it_c do
        local wt = nil
        if mtype == "SubjugationMission" then
          print("Wave " .. wave)
          wt = mob_level_counts[wave]
        end
        local mob_level_counts = wt or mob_level_counts
        for id, count in pairs(mob_counts) do
          --print(" ", id, enemies[id]._name, "x" .. count, "Level = " .. mob_min_levels[id] .. " .. " .. mob_max_levels[id])
          for lvl, count in pairs(mob_level_counts[id]) do
            --io.stderr:write(id .. "\n")
            local ene_name = ene[id] and ene[id]._name
            if ene[id] and ene_name == nil then
              local pattern = (ene[id].PatternID - 0x00200000) // 0x100
              ene_name = enemygfx_names[pattern]
              --print(id, pattern, ene_name)
            end
            if ene_name == nil or ene_name == "" then
              ene_name = "?"
            end
            print(" ", id, ene_name, "x" .. count, "Level = " .. lvl)
          end
        end
      end
      for id, _ in pairs(missing_mobs) do
        print(" ", "missing", id)
      end
      print()
      if guest_lookup[mission.QuestID] then
        for _, guest in ipairs(guest_lookup[mission.QuestID]) do
          print("Guest: " .. unit.get_name(guest.ID_Card))
          print("Location: " .. guest.ID_PlaceID)
          print("Level: " .. guest.Param_Level)
          print("Affection: " .. guest.Param_Love)
          print("Skill level: " .. guest.Param_SkillLevel)
          print("Class change: " .. format.get_enum("cc", guest.Param_ClassChange))
          if guest.Param_ExpressionCommand ~= 0 then
            print("Expression: " .. guest.Param_ExpressionCommand)
          end
          print()
        end
      end
      if #dialog > 0 then
        for _, seq in ipairs(dialog) do
          for _, t in ipairs(seq) do
            print(t)
          end
          print()
        end
      end
    else
      io.stderr:write("unavailable entry: " .. mapn .. "/" .. entryn .. " for mission " .. mission.QuestID .. " " .. mission._name .. "\n")
    end
  else
    io.stderr:write("unavailable map: " .. mapn .. "\n")
    --print(mission, series)
  end
end
--[[
if series and not nametexts[series] then
    local nt = "QuestNameText" .. series .. ".atb"
    nt = dl.getfile(nil, nt)
    nt = parse_al.parse(nt)
    nt = parse_al.totable(nt)
    nametexts[series] = nt
  end
  if series and nametexts[series] then
    local nt = nametexts[series]
    if nt and nt[series_i] then
      mission._name = nt[series_i].Message or ("unknown " .. mission.QuestTitle)
    else
      mission._name = "unknown " .. mission.QuestTitle
    end
  end
]]
if dl.listhasfile(nil, "StoryMissionConfig.atb") then
  for _, mission in ipairs(missions) do mission._name = nil end
  for _, mtype in ipairs(mission_types) do
    local qlname = mtype .. "QuestList.atb"
    if dl.listhasfile(nil, qlname) then
      local qlist = dl.getfile(nil, qlname)
      qlist = parse_al.parse(qlist)
      qlist = parse_al.totable(qlist)
      for i, entry in ipairs(qlist) do
        local series = entry.MissionID
        local nt = "QuestNameText" .. series .. ".atb"
        if dl.listhasfile(nil, nt) then
          
          nt = dl.getfile(nil, nt)
          nt = parse_al.parse(nt)
          nt = parse_al.totable(nt)
          
          for _, mission in ipairs(missions) do
            if mission.QuestID == entry.QuestID then
              mission._name = mission.QuestTitle and nt[mission.QuestTitle + 1] and nt[mission.QuestTitle + 1].Message or "???"
              --print(entry.MissionID // 100000) os.exit()
              --handle_mission(mission, entry.MissionID, i)
              break
            end
          end
        end
      end
    end
  end
  for _, mtype in ipairs(mission_types) do
    local qlname = mtype .. "QuestList.atb"
    if dl.listhasfile(nil, qlname) then
      local qlist = dl.getfile(nil, qlname)
      qlist = parse_al.parse(qlist)
      qlist = parse_al.totable(qlist)
      for i, entry in ipairs(qlist) do
        for _, mission in ipairs(missions) do
          if mission.QuestID == entry.QuestID then
            --print(entry.MissionID // 100000) os.exit()
            handle_mission(mission, entry.MissionID, i, mtype)
            break
          end
        end
      end
    end
  end
  for _, malt in ipairs(mission_alt) do
    local cfgname = malt .. "Config.atb"
    if dl.listhasfile(nil, cfgname) then
      local cfg = dl.getfile(nil, cfgname)
      cfg = parse_al.parse(cfg)
      cfg = parse_al.totable(cfg)
      for i, entry in ipairs(cfg) do
        local nt = "QuestNameText" .. entry.MissionID .. ".atb"
        if dl.listhasfile(nil, nt) then
          
          nt = dl.getfile(nil, nt)
          nt = parse_al.parse(nt)
          nt = parse_al.totable(nt)
          
        else
          nt = nil
        end
        local j = 1
        for q in entry.QuestID:gmatch("%d+") do
          q = assert(tonumber(q))
          for _, mission in ipairs(missions) do
            if mission.QuestID == q then
              if nt then
                mission._name = mission.QuestTitle and nt[mission.QuestTitle + 1] and nt[mission.QuestTitle + 1].Message or "???"
              else
                mission._name = "?"
              end
              handle_mission(mission, entry.MissionID, j)
              j = j + 1
              break
            end
          end
        end
      end
    end
  end
else
  for _, mission in ipairs(missions) do
    handle_mission(mission)
  end
end
