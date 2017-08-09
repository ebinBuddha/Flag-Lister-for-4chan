# Flag Lister for 4chan
Lists both original flags and Extra Flags in the current thread.
Works on /bant/ /int/ /pol/ and /sp/

# How to Install
1. Install GreaseMonkey/TamperMonkey on your browser
2. Click the following link to install the script:
   https://github.com/ebinBuddha/Flag-Lister-for-4chan/raw/master/Flag-Lister-for-4chan.user.js
3. Install Extra Flags for int by Flaghunters if you want regional flag support:
   https://github.com/flaghunters/Extra-Flags-for-4chan/raw/master/Extra%20Flags%20for%20int.user.js
   
# How to Use
A Little window will appear. The top ▼/▲ button will allow to expand/shrink the view.
With the expanded view the flag list will be shown.
Tick/Untick the checkbox to show/hide the regionals (Extra Flags for int by Flaghunters must be installed).
The regionals won't be shown and updated automatically:
  click force refresh button (↺) to show and update them.
Want it to be automatic whenever the thread is updated? Read the next paragraph!

# How to Setup automatic list update for regionals (a bit of geekiness may be needed)
Next steps apply if you want automatic listing of regionals shown by Extra Flags.
NOTE: Each time the Extra Flags script is updated, the following changes are deleted...
   you may want to disable automatic updates for that script, so be sure of what you're doing.
   
1. Open the Extra Flags to edit it
2. Add the following line among the first variables (line 56ish):
   var event = new Event('doneExtraFlags');
   
   example:
   ...
   var getUrl = 'int/get_flags_api2.php';
   var shortId = 'witingwc.ef.';
   var regionDivider = "||";
   var event = new Event('doneExtraFlags');   //<-- add this here
   
3. Look for function onFlagsLoad and add the following line just before the closing bracket of the function:
   document.dispatchEvent(event);
   
   example:
   ...
   
   /** the function to get the flags from the db uses postNrs
   *  member variable might not be very nice but it's the easiest approach here */
   function onFlagsLoad(response) {
    //exit on error
	... blah blah ...
           }
       });
	   document.dispatchEvent(event);  //<-- add this here
   }  // <- closing bracket (line 367ish)
   
4. Save the file and reload the pages if needed.