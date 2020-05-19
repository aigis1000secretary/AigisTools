AigisTools release 2
By, lzlis

These is a bunch of programming I have to do help with decoding and presenting game information from the browser game Millennium War Aigis (NSFW).

These tools are not really made to be user-friendly. There is no GUI, and they all operate from the command line.

==========
DISCLAIMER
==========

See _license.txt for information about software/data licensing.

For the software provided by lzlis, it is provided "as is", without warranty of any kind, express or implied, including but not limited to warranties of merchantibility, fitness for a particular purpose and noninfringement. In no event shall the author be liable for any claim, damages, or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

Lzlis also disclaims any reprecussions using this software may have on your Nutaku or DMM acount.

Nutaku accounts are governed by their own terms of service (https://www.nutaku.net/terms/). You are responsible for complying with those terms.

DMM account are also governed by their own terms of service (https://terms.dmm.co.jp/member/).

===============
Getting Started
===============

You will need to find the URL of the file list for the current version of the game. This URL generally changes each time the game is updated (ie after each maintenance).

This can be done in your browser. Open Aigis in your browser and wait for the click-to-continue prompt. (If Aigis is already open, you can refresh the page, or use the in-game return to title option.)

Firefox instructions:

Open the "Developer Tools" to the "Network" tab (Ctrl+Shift+Q). Leave this open, and then click in the Aigis window to start loading the game. In the Network view, you should see a growing list of network requests. Scroll up to the top. The first (or one of the first) requests should be for a file called "1fp32igvpoxnb521p9dqypak5cal0xv0". Click on this. On the right pane, make sure the "Headers" tab is selected (this should be the default). You should see "Request URL:" followed by the URL you need. Copy this URL to the Windows clipboard.

Chrome instructions:

Open the "developer tools" (Ctrl+Shift+I) and select the "Network" tab. Leave this open, and then click in the Aigis window to start loading the game. In the Network view, you should see a growing list of network requests. Scroll up to the top. The first (or one of the first) requests should be for a file called "1fp32igvpoxnb521p9dqypak5cal0xv0". Click on this. On the right pane, make sure the "Headers" tab is selected (this should be the default). You should see "Request URL:" followed by the URL you need. Copy this URL to the Windows clipboard.

Open the text file called "files.txt" in the AigisTools folder and paste the URL into it. Then save it. This tells AigisTools how to find the game data it needs to operate. AigisTools can automatically download the file list as well as any files it points to. These files will be saved in the Data\Cache subfolder of your AigisTools installation. This way, each file only needs to be downloaded once.

Related instructions also appear online at: http://millenniumwaraigis.wikia.com/wiki/User_blog:Lzlis/Downloading_and_Interpreting_Game_Files

Note 1: The way that AigisTools downloads files is roughly equivalent to visiting a web-page. However, there are possibly differences between a request for a file made from AigisTools and a request made from the actual game client. That means that the people in charge of running Aigis could theoretically determine that you are (or at least your IP address is) using AigisTools to download their files. Please download at your own risk! It would also be possible to get the needed files by saving out the files that have already been downloaded by your browser while playing the game (at least for files that you can make the game download -- you may not, for example, be able to make the game client download images for units you don't own), but this can be quite tedious.

Note 2: Whenever AigisTools downloads a new file from the Aigis file server, it will first wait for 30 seconds before starting the download. You should see a notification of this in the command prompt window. This is done as an attempt to be polite to the Aigis servers. But, if you are impatient, you can press any key to start the download right-away. (Please don't do a DoS attack on the servers, though...)

Note 3: I keep a list of old file list URLs so that I can easily go back and run AigisTools on older versions of the game. You can do this too, if you want. (From what I can tell, old file URLs continue to stay active online, but it's possible that some may direct to newer versions of the file after the fact. But, this doesn't matter if you already have the old file locally in your cache.)

Having the file list is sufficient for running many of the scripts. However, some scripts need additional data as well. First, you'll need to setup a place to put the data. Go to the Data\XML folder in your AigisTools installation. Create a new folder here. You can call it whatever you want, but I use the date and the server (e.g. "nutaku_2016_07_05"). Like the file list, this data may change each time the game is updated.

Getting this data is similar to getting the file list. Again, open the developer tools and then start the game while looking at the request list in the developer tools. (You don't actually need to start the game again if you just finished getting the file list -- just leave the request list open.) There are two requests you're looking for: GRs733a4 (which contains important information about units) and QxZpjdfV (which contains important information about missions). For each of these files, first find it in the request list. It should be towards the end of the things that are requested when loading the game. If it appears more than more, you want the POST (which should be the last one). Create a text file in your new data folder to hold the data.

Firefox instructions:

Right click on the request in the left pane of the request list, and select "Copy Response". Paste the result into your new text file. Then save it.

Chrome instructions:

Right click on the request in the left pane of the request list, and select "Copy" -> "Copy Response". Paste the result into your new text file. Then save it.

Then, rename the file to the name of the request (either GRs733a4 or QxZpjdfV). Make sure you also delete the file extension (".txt"). (If you can't see the file extension to delete it, you may have to configure Windows to show file extensions. Try searching the web for "how to show file extensions in windows.")

Then open the text file called "xml.txt" in the AigisTools folder and type in (or paste in) the name of the folder you created (e.g. "nutaku_2016_07_05"). This tells AigisTools to use the data from this directory.

Note: Like with the file list, I keep old versions of these files in my Data\XML folder so I can run AigisTools on older versions of the game. This is why AigisTools organizes the data in this way. You don't have to do the same, but you may want to.

You should now be ready to run some scripts! To run a script, first run "AigisTools.bat". This should open a command prompt. You can type in commands to the command prompt, then press enter, and your computer will execute them.

When I explain how to type in commands, it will look like this:
>do get_file_list.lua

You don't need to type in the ">" part -- this just indicates that it is an example of a command. The ">" also matches what you will see in the actual command prompt right to the left of where the command will be typed in. Following lines that don't start with ">" may indicate example output of the command.

All of the things that AigisTools can do are represented by files in the Scripts folder of your AigisTools installation (but not the Scripts\lib subfolder). Below is a short reference of scripts.

Note: Many scripts will write files to "out" subdirectory of your AigisTools installation (creating it if it doesn't exist). Other command print to the screen. Sometimes for commands that print to the screen, I will give an example usage that writes to a text file instead of printing to the screen. In this case, the "out" folder must exist already, so if it doesn't exist, you may want to create it manually. Some scripts will also create a "working" folder. Generally, this is just used for intermediate stages of processing, and you can safely delete anything here when the script is finished (or you can just be lazy and leave it alone).

Note 2: Instead of starting a command with "do something.lua", you can alternatively start it with "lua Scripts\something.lua" which is longer, but you can use the command prompt's tab-completion feature.

========
UPDATING
========

When updating, you can just use the new package. However, you may want to continue using your old Data\Cache and Data\XML folders.

For release 2, the only important updated files are in the Scripts folder, so just replacing the Scripts folder with the new one should work fine. Some of the Data\meta files are also updated, but not critical.

===============
SCIPT REFERENCE
===============

* get_file_list.lua
Example Usage:
>do get_file_list.lua

This outputs the file list in text format to out\files\files.txt. This is mostly useful for seeing which files are available to use with get_file.lua. There is other information as well, but the files names are in the far-right column (e.g. SkillList.atb).

* get_file.lua
Example Usage:
>do get_file.lua SkillList.atb

This converts the file to a more human-readable format (e.g. text file or png image), and outputs it to a subfolder of out\files\ (or just a file in the case of files that need no translation like png). (Previous output of the same file may be overridden, but parts of it may remain. To make sure you're only seeing new data, you can always be safe and delete the previous output.) Note that some types of Aigis files may get translated to multiple files (or even subfolders) in the decoding process.

The basic Aigis-specific file types are:
  * atb: Table file, translated to aligned text
  * atx: Texture (image) file, translated to png(s)
  * aar: Archive file, translated to a folder
  * aod: Animation data file, translated to png(s) (sometimes, not always working) and text

* parse_cards.lua
Example Usage:
>do parse_units.lua > out\cards00.txt

Creates a table from the GRs733a4 data, but adds a unit name column to make it more readable. This contains most of the unit-specific info for each unit, but it is still in a pretty raw form.

Data about the gacha/shrine is also appended to the end. The gacha columns are suppressed from the main table because they make diffs really noisy. (Note that we can't really prove the gacha data served to the client is the same as what's used on the server, but I feel that it seems right. Note also that this data is no longer served to the client in DMM since the gacha revamp there.)

* parse_missions.lua
Example Usage:
>do parse_missions.lua > out\missions00.txt

Creates a report of all currently-available missions. (The name and location of the output file is included in the command and can be changed.) This is a summary, so not all the gory details are included. Beware, this script will have to download a large numer of files the first time you run it.

Most of the information should be fairly self explanatory, but I'll give a few extra notes:
  * The initial number is <EventID>/<QuestID>. Quest IDs are globally unique, but it is also useful to know the eventID because, for example, each event potentially has a different enemy table (and other things).
  * "Level" is the enemy scaling amount as a percentage (applying to HP and melee damage). The entire mission has a scaling number, and each enemy also has a scaling number. These two are multiplied together. If the level is 0, it actually counts as 100.
  * "map" refers to the separate file. E.g. map=8022 means to look at Map8022.aar. The map archive contains information about the map image, the full enemy listing and pattern, dot locations, weather, etc.
  * "entry" and "location" refer to which entry file and which location file to use from the map archive. (Often times there is only one of each anyway...)
  * "terms" refers to special conditions for the mission (e.g. poison fog, fast enemies, desert, etc).
  * Details of the terms are decoded based on QuestTermConfig.atb and my best understanding of what the term influences mean. (Uncommon or new terms will require more user interpretation.)
  * Story missions will also have extra info about the 4-star "hard" version of the mission if applicable.
  * The enemy listing first lists the ID. Enemy IDs are specific to the EventID (although Nutaku has been keeping IDs < 600 consistent lately).
  * After that comes the enemy name. Enemies do not have a canonical name. Currently the enemy name is determined by looking up the graphics (not regarding resizing) in Data\meta\enemy_gfx.txt. This is just a quick reference I threw together, and a lot of things are missing (especially for DMM or newer events), and things could also be wrong. If the name begins with "/" that means I think the name is really bad and needs to be revised. Feel free to edit this.
  * (If running AigisTools on older versions of the game, enemy_names.txt may be used instead, which just uses an ID lookup, but hope you never have to deal with this...)
  * The report groups together enemies with the same ID and level (scaling value), and indicates the quantity.
  * Subjugation missions are automatically divided into waves of 100, but there is nothing in the actual data giving this division.
  * If any ally/guest units are present for the mission, their details will be listed.
  * Orb rewards may be mixed up for the DMM version (or potentially after a patch). (It's a TODO for me to look this up in the orb table...) Also, I think I didn't get around to adding names for some of the newer ones...
  * Mission dialogue follows the rest of the mission report. It is automatically divided up the same was as it is in the map archive, but there's not really any way to tell what the divisions mean without prior knowledge or looking up the entry data in the map archive.
  * If the mission uses the old style of encoding dialogue, it may be missing from the report.

* get_xmlfile.lua
Example Usage:
>do get_xmlfile.lua GRs733a4

Creates a table directly from the data of the given file in the XML directory. "cards" can be used as an alias for "GRs733a4" and "missions" can be used as an alias for "QxZpjdfV".

* parse_enemy.lua
Example Usage:
>do parse_enemy.lua 100001/3

The syntax is <EventID>/<EnemyID>. Both of these can be gleaned from the "parse_missions.lua" report. (If just <EnemyID> is provided, it will use Enemy.atb, but I don't believe the game actually uses this since Autumn 2016 on either DMM or Nutaku. There's also a syntax for the original implementation of daily revivals on DMM which were stored differently, but probably no one else will ever need to use that.)

This usage will simply print the data out in the command prompt window.

Notes:
  * The name is again based on the graphics using Data\meta\enemy_gfx.txt, so the same disclaimers from parse_missions.lua apply. The number following in parentheses is the graphics ID which is needed to know which line of enemy_gfx.txt is being used.
  * New attributes (e.g. "Stealth", "Undead") may not be detected until they are added in the script.
  * Range displays first the unscaled value, then the scaled value. The scaled value is the one that is actually meaningful in-game.
  * AR is "assassination rate" (my name). The first number is as it is stored in the game data, and the number in parentheses is divided by 1000 giving the actual multiplier.
  * SCL is the value by which the graphics data is scaled up. (1.5 is a very common value.) (This is the value that gets used to scale range.)
  * The splash value is unscaled here, and needs to be multiplied by 4/3 to get the units currently used on the wiki.
  * FAS is the base attack speed (in frames), FIN is the initial dealy, FMV is the number of frames between moves, etc.
  * The way FIN is actually probably off by 1 or 2. I need to go through and update all the enemy pages at some point, but for now it's okay.
  * If UP is missing, the game will interpret it as 1.
  * For enemies that have special effects, some special effects are hard-coded and some are not.
  * The ones that are hard-coded mostly have friendly names that should be outputed, but if not the effects will have to be infered from investigation, or prior knowledge.
  * For non-hardcoded effects (34+ on Nutaku), see EnemySpecialty_Config.atb.

* get_unit.lua
Example Usage:
>do get_unit.lua 264

This will output detailed information about the unit with the given card ID. Associated images are extracted as well. All the output is put in a subfolder of out/cards.

Notes:
  * Sprite images are not yet scaled.
  * Effects of skills and abilities are listed, but are not taken into account when they modify other numbers (e.g. stat bonuses or extra MR)
  * In some cases, skill and ability descriptive details are simply best guesses. Generally I am reasonably confident if I have bothered to provide extra details, but there is always a chance of error -- this information doesn't always come directly from the game files.
  * In particular, skill details currently play somewhat loosely with the interpretation of the skill influence parameters (especially with regard to skill power for uncommon influences).
  * Note that some abilities don't necessarily do what they say they do in some cases. For example, attack speed changes from abilities are usually just coded directly into the attack animation and the ability does nothing. In other cases, abilities may have extra effects, for example, to account for class features that for one reason or another are not coded as class abilities. Also, things like drop rate bonuses should probably taken with a grain of salt, as these may only have an effect on the server.

Alternate Usage:
>do get_unit.lua 264 text

Details will be printed to the command window, and images will not be extracted.

* get_skill.lua
Example Usage:
>do get_skill.lua 122

This will output the details for the skill with the given ID. It works the same as the skill output from get_unit.lua.

* get_ability.lua
Example Usage:
>do get_ability.lua 75

This will output the details for the ability with the given ID. It works the same as the ability output from get_unit.lua.


* parse_speed.lua
Example Usage:
>do parse_speed.lua > out\speed00.txt

Creates an attack speed report for all units. There is an entry for each class of each unit. In some cases, there will be additional entries labeled "alt" which indicates an alternate attack animation. This generally means the unit has a skill that switches the unit to use that attack animation, but refer to the skill data if you want to be sure.

Notes:
  * The first line of the entry is the number of frames (60 fps) that the attack takes. The numbers after the are the breakdown of animation time vs cooldown time. Add 1 to each to get the true value as seen when playing the game. (The printed numbers are the numbers as they appear in the data.)
  * The "Initial" indication is when the damage/missile occurs. Also add 1 to this to get the true value.
  * The "Timing" is a breakdown of when each new image in the animation appears.
  * Lots of things can change cooldown, but none of them are detected here. This report always gives the base cooldown for the class.
  * For example, Nanaly Artemis has an alt animation with slower speed. However, the speed in game isn't actually slower because the skill changes cooldown to compensate.
  * Possibly some of the flying units with separate shadow sprites will confuse things here -- I don't remember if I fixed it or now.

* parse_unitstats.lua
Example Usage:
>do parse_unitstats.lua > out\stats00.txt

Generates a report of the min-level and max-level stats for every unit at every class evolution.

Notes:
  * Some stats will output with asterisks. These are rounding corner cases. I'm pretty sure they're right, but it may be wise to double check these cases anyway.
  * Token units will have stats for multiple levels, as they may need to match multiple rarities.
  * Silver units will give stats for both class-changed level 50 and class-changed level 55.
  * Effects of skills and abilities (e.g. Power Attack) are not included.
  * See also http://millenniumwaraigis.wikia.com/wiki/User_blog:Lzlis/Unit_stats

* mission_map.lua
Example Usage:
>do mission_map.lua 140

The number given here should be a Quest ID (as seen in the parse_missions.lua report). This will attempt to generate an annotated map image to be uploaded to the wiki. The map image will be outputted in the out\missions folder.

Not everything about the map can be generated automatically. Additional data is fed into the process from the file Data\meta\map.txt. You will have to add data to this file in order to generate new maps.

The map.txt file is divided into different sections, one for each different Quest ID. The section begins with the Quest ID enclosed in brackets []. (I usually follow this with the quest name so it is more readable, but this is not necessary. I also usually keep the quests sorted by ID, but this is also not neccessary.)

There are various other data entries that can be added to customize the data:
  * remap=... : This changes order in which the player unit dots are lettered. By default, they are simply lettered in the order they are stored in the game data, which is sometimes nonsense. I generally try to match the lettering used on seesaawiki if it is available, or else match another mission which uses the same (or a similar) map if possible, or else choose something sensible, generally with all melee dots followed by all ranged dots. Enter the un-remapped letter for each dot starting with the one you want to be "A", then "B", etc. Use capital letters to refer to single letters and lower case letters to refer to double letters (if any). Be careful, as it won't work if you miss a letter. It is also possible to use "-" if you don't want to use the next letter. For example "remap=-ABC" would relabel three dots from "A, B, C" to "B, C, D" (with no "A").
  * skip=... : Sometimes there is a dot offscreen (yes, really) in which case you may want to avoid numbering that dot. In that case, you can omit it from "remap=...", and add it to "skip=...". (In retrospect, it should also work just to put that dot last...)
  * ally=... : This will turn this indicated dots green to indicate that an ally starts in these positions. Use the un-remapped dot letters. (Again, single = capital, double = lowercase.)
  * alert=... : This determines which color to use for each alert icon. 1 = yellow (melee), 2 = orange (flying), 3 = cyan (non-flying, but off the path generally). Less common options are L = yellow and orange side-by-side and l = cyan and orange side-by-side. (Sorry, I didn't add R/r yet...) Also, - can be used to skip drawing an alert. By default, alerts draw as numbers. This way, you can see what order to use. (They are sorted by the internal route ID.)
  * +route=... : Comma-separated list of routes to use. By default, all routes for which the game actually displays an alert are included, but sometimes additional routes need to be added. (Also note, sometimes routes begin off the edge of the map. This can be annoying...)
  * alertfix... : This can be y or n for each route. When it is "y", mission_map.lua will simulate movement along the route until the alert icon will be placed inside the boundaries of the map (plus a small margin). This can be useful if the route starts off-screen but still needs an alert icon. IIRC, it only supports moving up the the first waypoint, though. See also, "alertoff=..."
  * alert+x... : Comma-separated list of positive or negative pixel offsets added the horizontal position of each alert.
  * alert+y... : Comma-separated list of positive or negative pixel offsets added the vertical position of each alert.
  * alertoff... : Single digit number of each alert that indicates a number of waypoints to skip from the beginning of the route. Similar to alert_fix (actually, both can be used in combination), but sometimes it can give a nicer result.

There's also an alternate mode of using mission_map.lua that goes like this:
>do mission_map.lua 140 route

This will ignore the data in map.txt (so it can be useful to create a reference for un-remapped dot letters). Also, instead of printing out the normal alert numbers, it will print out the route number for every route at the start of each route. This can be a good way of seeing which routes need to be added with "+route=...", and it can also serve as a companinion when trying to read the map's entry file. However, it can get kind of messy when lots of routes are stacked on top of one another...

Another alternate mode is to use:
>do mission_map.lua 140 nodot

This will only print the alert info. This can help when trying to quickly make sure you've gotten the alerts right, as printing all the dots onto the image is actually quite slow.

Making maps this way can be kind of slow and tedious, so sorry about that if you're trying to actually do it ;)

* download_all.lua
Example Usage:
>do download_all.lua

Downloads all files from the filelist. This might be nice if you are trying to archive files, especially if you are worried they may be changed on the server later. However, it may take a lot of time and bandwidth to run.

======
IMAGES
======

Images generated by AigisTools are in png format. For many types of images, it is standard practice of the wiki editors to use a piece of software called PNGOUT.EXE to make the png as small as possible (in terms of file size) (without losing any quality). This is standard for unit and enemy sprites, unit icons, and mission maps. (I generally don't do it for renders as they are already pngs in the game data.) Due to it's license, PNGOUT.EXE can't be included with the AigisTools distribution, but you can get it here: http://www.advsys.net/ken/utils.htm

Also note that enemy and unit sprites are generally resized by the game before being displayed, and so it is standard practice to resize them before uploading them to the wiki. The scaling can be done with scale_image.lua (included). Related information is also available here: http://millenniumwaraigis.wikia.com/wiki/User_blog:Lzlis/Downloading_and_Interpreting_Game_Files#Dealing_with_sprites

Enemy scale values are outputed by "parse_enemy.lua", and unit scale values are part of the GRs733a4 table (but almost always are 1.5).

=======
CONTACT
=======

The best way to contact lzlis is through the Millennium War Aigis Wiki. Either leave a message on the wall (http://millenniumwaraigis.wikia.com/wiki/Message_Wall:Lzlis), or leave a comment on a relevant blog post. If you can't contact lzlis this way, it's probably hopeless (although be patient!). But, these messages will be public, some hopefully someone else can help you :)
