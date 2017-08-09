# Flag-Lister-for-4chan
Lists both original flags and extraFlags in the current page

# How to Install
1. Install GreaseMonkey/TamperMonkey on your browser
2. Navigate to the following link to install the script:
   https://github.com/ebinBuddha/ID-Jumper-for-4chan/raw/master/ID-Jumper-for-4chan.user.js

# How to Setup - 
Next steps apply if you want support for regionals from Extra Flags
3. Open the Extra Flags to edit it
4. Add the following line among the first variables (line 56ish):
   var event = new Event('doneExtraFlags');
   
   example:
   ...
   var getUrl = 'int/get_flags_api2.php';
   var shortId = 'witingwc.ef.';
   var regionDivider = "||";
   var event = new Event('doneExtraFlags');   //<-- add this here
   
5. Look for function onFlagsLoad and add the following line just before the closing bracket of the function:
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
   
6. Save the file and reload the pages if needed.