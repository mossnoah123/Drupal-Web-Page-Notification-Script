# Drupal Web Maintenance Notification Script

## Summary
The purpose of this script is to automate the task of manually
tracking when Drupal web pages should be reviewed and maintained
so that the information being relayed on the site is the most current and up-to-date.

The [Teaching and Technology Center](https://www.uwplatt.edu/ttc) (TTC) at UW-Platteville maintains a Google Sheet of TTC-owned
Drupal web pages. This sheet tracks page titles, links to said
page, a description of what elements on that page need to be
checked, and the frequency at which the page should be tracked.

Below is a sample Google Sheet that this script interacts with.
It shows the sheet that the TTC uses to keep track of all
TTC-owned Drupal web pages.

![Google Sheet displaying all of the TTC-owned Drupal web pages](assets/TTC%20Page%20Maintenance%20Google%20Sheet%20Example.png "This is a sample Google Sheet; the TTC's Web Maintenance spreadsheet.")

## Background

## The Problem
The Drupal pages on the UW-Platteville website do not notify you when the information on them is out of date. It is ultimately up to the person(s) maintaining the page to recognize when the page has to be updated. If a page is not up-to-date, then that page loses its credibility when it could actually be a great resource.

## The Project
This script was written in the Spring of 2017 by one of the former TTC Tech Team leads. He did a great job at creating a functional script. However, I noticed there was room for improvement when I attempted to perform maintenance on the script.

My goal with this project is to use what I had learned from creating the [KB Article Expiration Notification Script](https://github.com/mossnoah123/KBArticleExpirationNotification) and apply it to this project. I want to structure this script more so that it is easy to maintain in the future.

## Future Plans for this Project
* Dynamically retrieve the frequency periods from the spreadsheet so that the verbage may be changed in the future without breaking the spreadsheet.
* Add a dropdown list in the Maintenance Log sheet for Frequency Periods and verify that the value returned is still a string.
