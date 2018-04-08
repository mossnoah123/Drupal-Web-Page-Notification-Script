// Original Author: Matt D.
// Date Created: 2/15/2017
// Date Updated: 4/8/2018 by Noah Moss
// Purpose: This script automatically searches for pages that need to be updated (from the spreadsheet) 
//    and sends a notification email detailing the information. 
// Please follow the naming conventions on the sheet titled: "How to Format Frequency Period". 


// Constants
var EMAIL_RECIPIENT = "ttc@uwplatt.edu";
var EMAIL_SUBJECT = "Attn: Drupal Webpage Update required";
var FREQUENCY_SEMESTER = "semester";
var FREQUENCY_YEAR = "year";
var FREQUENCY_CYEAR = "c_year";
var FREQUENCY_MONTH = "month";
var FREQUENCY_WEEK = "week";
var PAGE_TITLE_HEADER = "Page Title";
var PAGE_LINK_HEADER = "Page Link";
var PAGE_DESCRIPTION_HEADER = "Description of Elements to be checked";
var PAGE_FREQUENCY_HEADER = "Frequency of check period";
var SHEET_COLUMN_RANGE = "A:D";
var COLUMN_HEADER_ROW_INDEX = 0;
var FIRST_PAGE_TO_UPDATE_ROW_INDEX = 1;
var SEMESTER_START_DAY = 2;

// Page-to-Update struct
var PageToUpdate = function (title, link, description, frequency) {
    this.title = title;
    this.link = link;
    this.description = description;
    this.frequency = frequency;
}

// Months enum
var Month = {
    "JANUARY":0,
    "FEBRUARY":1,
    "MARCH":2,
    "APRIL":3,
    "MAY":4,
    "JUNE":5,
    "JULY":6,
    "AUGUST":7,
    "SEPTEMBER":8,
    "OCTOBER":9,
    "NOVEMBER":10,
    "DECEMBER":11
}
Object.freeze(Month);

// Days of Week enum
var DayOfWeek = {
    "SUNDAY":0,
    "MONDAY":1,
    "TUESDAY":2,
    "WEDNESDAY":3,
    "THURSDAY":4,
    "FRIDAY":5,
    "SATURDAY":6   
}
Object.freeze(DayOfWeek);

// Email Body Build Type enum
var BuildEmailBodyTypes = {
    "NEW":0,
    "INSERT":1,
    "CONCLUDE":2
}
Object.freeze(BuildEmailBodyTypes);


/**
 * Runs the script.
 */
function main() {
    var currentDate = new Date();
    var todaysPageFrequencies = getTodaysPageFrequencies(currentDate);
    if (todaysPageFrequencies.length != 0)
    {
        var emailBody = buildEmailBody(BuildEmailBodyTypes.NEW, null, null);
        var pagesToUpdateSheet = getPagesToUpdateSheet();
        var pagesToUpdateWithinSheet;
        try {
            pagesToUpdateWithinSheet = getPagesToUpdateWithinSheet(pagesToUpdateSheet);
        }
        catch(err) {
            Logger.log("Error: " + err.message + " Terminating the script now.");
            return;
        }
        for each(var pageToUpdate in pagesToUpdateWithinSheet) {
            if (isPageMaintenanceRequired(pageToUpdate.frequency, todaysPageFrequencies))
                emailBody += buildEmailBody(BuildEmailBodyTypes.INSERT, pageToUpdate, null);
        }
        if (pagesToUpdateWereInsertedIntoEmailBody(emailBody, currentDate)) {
            emailBody += buildEmailBody(BuildEmailBodyTypes.CONCLUDE, null, null);
            sendEmail(emailBody);
        }
    }
}

/**
 * Builds an array of all page frequencies that exist on today's date and returns it.
 * 
 * @param {Date} currentDate - Today's date.
 */
function getTodaysPageFrequencies(currentDate) {
    var currentMonth = currentDate.getMonth();
    var currentDay = currentDate.getDate();
    var currentDayOfWeek = currentDate.getDay();
    var todaysPageFrequencies = new Array();
    if (isNewSemester(currentMonth, currentDay))
        todaysPageFrequencies.push(FREQUENCY_SEMESTER);
    if (isNewAcademicYear(currentMonth, currentDay))
        todaysPageFrequencies.push(FREQUENCY_YEAR);
    if (isNewCalendarYear(currentMonth, currentDay))
        todaysPageFrequencies.push(FREQUENCY_CYEAR);
    if (isNewMonth(currentDay))
        todaysPageFrequencies.push(FREQUENCY_MONTH);
    if (isNewWorkWeek(currentDayOfWeek))
        todaysPageFrequencies.push(FREQUENCY_WEEK);
    return todaysPageFrequencies;
}

/**
 * Gets the contents of every cell from each page-to-update's row, constructs a new page-to-update
 * object using those data contents, adds that new object to an array of page-to-update objects, 
 * and finally returns the array.
 * 
 * @param {Sheet} sheet - Sheet to get pages-to-update from.
 */
function getPagesToUpdateWithinSheet(sheet) {
    var rawSheetData = sheet.getRange(SHEET_COLUMN_RANGE).getValues();
    var lastPageToUpdateRowIndex = getIndexOfLastPageToUpdateRow(rawSheetData);
    if (lastPageToUpdateRowIndex == -1)
        throw new Error("There are no pages to update in the sheet " + sheet.getName() + "!");
    var arrayOfPagesToUpdateObjects = new Array();
    for (var i = FIRST_PAGE_TO_UPDATE_ROW_INDEX; i <= lastPageToUpdateRowIndex; i++) {
        var pageToUpdate = constructNewPageToUpdate(rawSheetData, i);
        arrayOfPagesToUpdateObjects.push(pageToUpdate);
    }
    return arrayOfPagesToUpdateObjects;
}

/**
 * Constructs and returns a new page-to-update object.
 * 
 * @param {Object[][]} rawSheetData - Container holding the contents of every cell from the sheet.
 * @param {Integer} rowIndex - Index of the page-to-update row to use.
 */ 
function constructNewPageToUpdate(rawSheetData, rowIndex) {
    var columnHeaders = new Array();
    var totalColumns = getTotalNumberOfColumns();
    for (var i = 0; i < totalColumns; i++) {
        columnHeaders[i] = rawSheetData[COLUMN_HEADER_ROW_INDEX][i];
    }
    var title = rawSheetData[rowIndex][columnHeaders.indexOf(PAGE_TITLE_HEADER)];
    var link = rawSheetData[rowIndex][columnHeaders.indexOf(PAGE_LINK_HEADER)];
    var description = rawSheetData[rowIndex][columnHeaders.indexOf(PAGE_DESCRIPTION_HEADER)];
    var frequency = rawSheetData[rowIndex][columnHeaders.indexOf(PAGE_FREQUENCY_HEADER)];
    var pageToUpdate = new PageToUpdate(title, link, description, frequency);
    return pageToUpdate;
}

/**
 * Determines the index of the last page-to-update row and returns it.
 * If there are no pages-to-update in the sheet, -1 is returned.
 * 
 * @param {Object[][]} rawSheetData - Container holding the contents of every cell from the sheet.
 */
function getIndexOfLastPageToUpdateRow(rawSheetData) {
    var pageToUpdateRowIndex = FIRST_PAGE_TO_UPDATE_ROW_INDEX;
    while (!isPageUpdateTitleCellEmpty(rawSheetData, pageToUpdateRowIndex))
        pageToUpdateRowIndex++;
    if (pageToUpdateRowIndex == FIRST_PAGE_TO_UPDATE_ROW_INDEX)
        return -1;
    else
        return pageToUpdateRowIndex;
}

/**
 * Determines whether the Title cell of a page-to-update is empty or not.
 * 
 * @param {Object[][]} rawSheetData - Container holding the contents of every cell from the sheet.
 * @param {Integer} rowIndex - Index of the page-to-update row to use.
 */
function isPageUpdateTitleCellEmpty(rawSheetData, rowIndex) {
    return rawSheetData[rowIndex][0].toString() == "";
}

/**
 * Returns the sheet that the list of pages to update is on.
 * NOTE: This function returns the first sheet in the spreadsheet. If the sheet that the list of 
 *    pages-to-update is not the first sheet, then you will need to get the desired sheet by
 *    its name.
 */
function getPagesToUpdateSheet() {
    return SpreadsheetApp.getActiveSheet();
}

/**
 * Determines the total number of columns in the sheet by using the sheet's column range.
 */
function getTotalNumberOfColumns() {
    var endOfColumnRangeIndex = SHEET_COLUMN_RANGE.length - 1;
    var firstLetterInColumnRange = SHEET_COLUMN_RANGE.charAt(0);
    var lastLetterInColumnRange = SHEET_COLUMN_RANGE.charAt(endOfColumnRangeIndex);
    var firstLetterASCIICode = firstLetterInColumnRange.charCodeAt(0);
    var lastLetterASCIICode = lastLetterInColumnRange.charCodeAt(0);
    var distanceBetweenLetterCodes = lastLetterASCIICode - firstLetterASCIICode;
    return distanceBetweenLetterCodes + 1;
}

/**
 * Determines whether a page-to-update requires maintenance or not.
 * 
 * @param {String} pageFrequency -  The frequency at which the page-to-update should be checked.
 * @param {String[]} todaysPageFrequencies - All of the page frequencies existing on today's date.
 */
function isPageMaintenanceRequired(pageFrequency, todaysPageFrequencies) {
    for each(var todayFrequency in todaysPageFrequencies)
        if (tryMatchPageFrequencyToOneExistingToday(pageFrequency, todayFrequency))
            return true;
    return false;
}

/**
 * Determines whether it is a new Fall/Spring semester or not.
 * 
 * @param {Integer} month - Month of the year to test against.
 * @param {Integer} day - Day of the month to test against.
 */
function isNewSemester(month, day) {
    return (month == Month.SEPTEMBER || month == Month.JANUARY) && day == SEMESTER_START_DAY;
}

/**
 * Determines whether it is a new academic year or not.
 * 
 * @param {Integer} month - Month of the year to test against.
 * @param {Integer} day - Day of the month to test against.
 */
function isNewAcademicYear(month, day) {
    return month == Month.SEPTEMBER && day == SEMESTER_START_DAY;
}

/**
 * Determines whether it is a new calendar year (January 1st) or not.
 * 
 * @param {Integer} month - Month of the year to test against.
 * @param {Integer} day - Day of the month to test against.
 */
function isNewCalendarYear(month, day) {
    return month == Month.JANUARY && day == 1;
}

/**
 * Determines whether it is the first of the month or not.
 * 
 * @param {Integer} day - Day of the month to test against.
 */
function isNewMonth(day) {
    return day == 1;
}

/**
 * Determines whether it is the start of a new work week or not.
 * 
 * @param {Integer} dayOfWeek - Day of the week to test against.
 */
function isNewWorkWeek(dayOfWeek) {
    return dayOfWeek == DayOfWeek.MONDAY;
}

/**
 * Attempts to match the frequency of a page-to-update to a page frequency existing today.
 * If the two are a match, then true is returned.
 * 
 * @param {String} pageFrequency - Frequency of a page-to-update.
 * @param {String} pageFrequencyExistingToday - Page frequency that exists today.
 */
function tryMatchPageFrequencyToOneExistingToday(pageFrequency, pageFrequencyExistingToday) {
    return pageFrequency == pageFrequencyExistingToday;
}

/**
 * Determines whether any pages-to-update were inserted into the body of the email to be sent.
 * 
 * @param {String} emailBody - Body of the email.
 * @param {Date} currentDate - Today's date.
 */
function pagesToUpdateWereInsertedIntoEmailBody(emailBody, currentDate) {
    return emailBody != newEmailBody(currentDate);
}

/**
 * Builds and returns a portion of the email body, depending on the specified build type.
 * 
 * @param {BuildEmailBodyTypes} buildType - Specifies which part of the email body to build.
 * @param {PageToUpdate} page - The page-to-update to insert into the email body.
 * @param {Date} currentDate - Today's date.
 */
function buildEmailBody(buildType, page, currentDate) {
    var emailBody = "";
    switch(buildType) {
        case BuildEmailBodyTypes.NEW:
           emailBody = newEmailBody(currentDate);
           break;
        case BuildEmailBodyTypes.INSERT:
           emailBody = insertPageToUpdateIntoEmailBody(page);
           break;
        case BuildEmailBodyTypes.CONCLUDE:
           emailBody = concludeEmailBody();
           break;
    }
    return emailBody;
}

/**
 * Composes and returns the intro/header of an email body.
 * 
 * @param {Date} currentDate - Today's date.
 */
function newEmailBody(currentDate) {
    var body = "Hello. This email is being sent to inform you that the following Drupal web pages ";
    body += "below require maintenance:\r\n\n ";
    return body;
}

/**
 * Composes and returns the main content of an email body.
 * 
 * @param {PageToUpdate} page - The page-to-update to insert into the email body.
 */
function insertPageToUpdateIntoEmailBody(page) {
    var body = "   - " + page.title + " [" + page.link + "]\r\n";
    body += "Elements to be checked: " + page.description + "\r\n";
    body += "How often this page should be checked: " + getFrequencyInEnglishText(page.frequency);
    body += "\r\n\n";
    return body;
}

/**
 * Composes and returns the conclusion of an email body.
 */
function concludeEmailBody() {
    var body = "\n";

    body += "STEPS YOU NEED TO TAKE:\r\n";
    body += "     - View the above page(s) that require maintenance and update them if necessary.\r\n";
    body += "     - Open the Maintenance Log itself and update any elements of a page if necessary.\r\n\n";

    body += "This was an automated email sent from the 'Drupal Maintenance Log - Email Script' script ";
    body += "which is attached to the 'Drupal Maintenance Log' spreadsheet located in the Google Drive of the ";
    body += "ttctt4@gmail.com email account.\r\n\n";
    body += "If you have any questions or concerns, please email Noah Moss at mossnoah123@gmail.com";
    return body;
}

/**
 * Uses Google's mail sending service to send the fully composed email detailing all of
 * the pages-to-update that require maintenance.
 * 
 * @param {String} emailBody - Body of the email.
 */
function sendEmail(emailBody) {
    MailApp.sendEmail(EMAIL_RECIPIENT, EMAIL_SUBJECT, emailBody);
}

/**
 * Takes in a page-to-update's frequency and returns its associated english output.
 * 
 * @param {String} pageFrequency - Frequency at which a page-to-update should be checked.
 */
function getFrequencyInEnglishText(pageFrequency) {
    var frequencyEnglishText = "";
    switch (pageFrequency) {
        case FREQUENCY_SEMESTER:
            frequencyEnglishText = "Every semester (Fall and Spring)";
            break;
        case FREQUENCY_YEAR:
            frequencyEnglishText = "Every academic year (start of each Fall semester)";
            break;
        case FREQUENCY_CYEAR:
            frequencyEnglishText = "Every calendar year (each January 1st)";
            break;
        case FREQUENCY_MONTH:
            frequencyEnglishText = "Every month";
            break;
        case FREQUENCY_WEEK:
            frequencyEnglishText = "Every week (starting on Monday)";
            break;
    }
    return frequencyEnglishText;
}