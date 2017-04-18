# myanalytics
Fast Analytics for @ers

## Overview
_Note: This project is intended for internal AIESEC use only. Hence, this project may reference some jargon from within the organization._

This single-page script was created to provide an easier way to access EXPA's analytics feature for LCs and MCs. It requests all programs APD and RE information by entering an access token from the platform. It also features the most frequently used time frames for requests.

## How does it work?
This script accesses the EXPA v2 API with ascynchronous calls. The v2 API spec has not yet been released to the public (it's up to AI to release this), but you can see an example of the v1 API here: http://docs.aiesecgisapi.apiary.io/ (not the real one though, you can check the real one on the @ HUB)

The version 2 of the script uses JQuery Deferred objects to include the "All MCs" feature, but will soon be updated to be use ES6 Promises.

### Context
This project was originally meant to be a simple snipet of code to be used in the terminal, so it doesn't include any fancy display of the information, just basic HTML and DOM Manipulation.

## Dependencies
Dependencies are part of the repository for local testing (this should change to CDN providers later on)
* JQuery (using minified 2.2.3 version)
* Hubspot's [Sortable](https://github.com/HubSpot/sortable "Sortable") script. (using minified 0.8.0 version)

## To-Do:
If you are an AIESECer and you want to contribute to the project, feel free to send pull requests with the features you would like to see, as well as reporting the issues you may encounter.

Some nice-to-have features that I users would like:
* Improvements in GUI
* Export to CSV / Excel feature
* No access token (this might require an OAuth 2 login with Google to control API usage rates)
