//Created by: Matt D.
//Last Updated: 2/16/2017 by Noah Moss
//Purpose: This script automatically search for pages that need to be updated (entered values) and send emails.
//Please follow the naming conventions on "How to Format Frequency Period". 

//------------------------------------------------------------------------------INSTRUCTIONS BELOW------------------------------------------------------------------------------------------

//Every value that can be changed will be commented.
//Required: spreadsheet name should be: "Log"

//If an email is send saying that the script failed, please check the execution transcripts (View, execution transcript) for errors.
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//Column locations on the spreadsheet.
var pageTitleCol = 1;
var pageLinkCol  = 2;
var updateDescCol= 3;
var frequencyCol = 4;
var emailCol     = 5;

//Month Variables
var jan = 0;
var newMonth = 1;

//Day of Week Variables
var monday = 1;

//Fall Semester Variables, dates
var semMonthFA = 6; //August 15
var semDayFA = 15;

//Spring Semester Variables, dates
var semMonthSP = 0; //January 8
var semDaySP = 1;

//Frequency of Check Period user text entry
var semesterTxt = "semester";
var yearTxt = "year";
var cYearTxt = "c_year";
var monthTxt = "month";
var weekTxt = "week";

/**
 * Calls the sendMail method depending on which relevant day it is.
 * Passes the text variable of the update frequency period to the sendMail method
 * This method runs on a trigger (throught the clock icon above)
 * The trigger is time driven, Every day at 2:00AM.
 */
function checkDate() {  
   var today = new Date();
   if(today.getMonth == semMonthFA && today.getDate() == semDayFA)  //semester (fall)
      sendMail(semesterTxt); 
   if(today.getMonth == semMonthSP && today.getDate() == semDaySP)  //semester (spring)
      sendMail(semesterTxt); 
   if(today.getMonth == semMonthFA && today.getDate() == semDayFA)  //academic year
      sendMail(yearTxt); 
   if(today.getMonth() == jan && today.getDate() == newMonth)       //yearly (calendar)
      sendMail(cYearTxt); 
   if(today.getDate() == newMonth && today.getDay() == monday) {    //New month and Monday is the 1st
      sendMail(monthTxt);
      sendMail(weekTxt);
   }
   if(today.getDate() == newMonth)                                  //monthly
      sendMail(monthTxt); 
   if(today.getDay() == monday)                                     //weekly
      sendMail(weekTxt);
}

/**
 * After being passed which type of day it is (New month, new year, new c_year, etc),
 * sendMail will check if any of those conditions exist on the spreadsheet.
 * If it finds a page that needs to be updated at @freqValue then it will send an email.
 * 
 * @param freqValue Frequency at which the email should be sent out.
 */
function sendMail(freqValue) {
   var requestData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");
   var frequencyArray = requestData.getRange('D:D').getValues();
   var emailSubject = "Drupal Webpage Update";
   for(var i=0; i<frequencyArray.length; i++) 
   {
      Logger.log(frequencyArray[i].toString(),freqValue);
      if(frequencyArray[i] == freqValue) 
      {
         var pageTitleVal  = requestData.getRange(i+1, pageTitleCol).getValue();
         var pageLinkVal   = requestData.getRange(i+1, pageLinkCol).getValue();
         var updateDescVal = requestData.getRange(i+1, updateDescCol).getValue();
         var email         = requestData.getRange(i+1, emailCol).getValue();
         MailApp.sendEmail(email, emailSubject, getMailBodyText(pageTitleVal, pageLinkVal, updateDescVal, freqValue));
      }
   }
}

/**
 * This method will run 3 hours after the main trigger for the script.
 * It will read the gmail account for failure scripts
 * If it finds an email from *this* script it will re-run the method: checkDate() then delete the email.
 */
function errorCheck() {
   var threads = GmailApp.getInboxThreads(0, 100); //Checks messages 0 to 100
   for (var i = 0; i < threads.length; i++) 
   {
      Logger.log(threads[i].getFirstMessageSubject());
      if(threads[i].getFirstMessageSubject() == "Summary of failures for Google Apps Script: Drupal Maintenance Log - Email Script") 
      {
         checkDate();
         threads[i].moveToTrash(); // This line will trash any email that isn't a Summary of Failure.
      }
   }  
}

/**
 * This method will return the body text of the email that will be sent to the TTC.
 * 
 * @param title Title of the page.
 * @param link Link of the page.
 * @param desc Description of the content to be updated on the page.
 * @param freq Frequency at which the email should be sent out.
 */
function getMailBodyText(title, link, desc, freq) {
   return ("Hello, \n\nThe page '" +  title + "' at: " + link + " needs to checked for updates." 
             + "\n\n" 
             + "The reason given for this update was: " +  desc  + "\n\n"
             + "This page is updated: " + freq + "\n\n"
             + "If you need additional help with this script, please contact Noah Moss at mossnoah123@gmail.com");
}