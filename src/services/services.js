import env_properties from '../../config.json';
import Rx from 'rx';
import RxDom from 'rx-dom';
import {TestGraphData} from './testGraphData';
import azure from 'azure-storage';
import {Actions} from '../actions/Actions';

const accountName = "ochahackfest";
const searchTermsTable = "dmaksearchterms";
const tableService = azure.createTableService(env_properties.OCHA_TERMS_TBL_CONN || '');

export const SERVICES = {
  host: "https://myservice-host.net/",
  
  getUserAuthenticationInfo(){
   ///Make sure the AAD client id is setup in the config
   let userProfile = window.userProfile;

    if(userProfile && userProfile.given_name)
       return userProfile;

    if(!env_properties.AAD_AUTH_CLIENTID || env_properties.AAD_AUTH_CLIENTID === ''){
      console.log('AAD Auth Client ID config is not setup in Azure for this instance');
      return {};
    }

    console.log('AD ID: ' + env_properties.AAD_AUTH_CLIENTID);

    window.config = {
      instance: 'https://login.microsoftonline.com/',
      tenant: 'microsoft.com',
      clientId: env_properties.AAD_AUTH_CLIENTID,
      postLogoutRedirectUri: 'http://www.microsoft.com',
      cacheLocation: 'localStorage', // enable this for IE, as sessionStorage does not work for localhost.
    };

    let authContext = new AuthenticationContext(config);

    var isCallback = authContext.isCallback(window.location.hash);
    authContext.handleWindowCallback();

    if (isCallback && !authContext.getLoginError()) {
        window.location = authContext._getItem(authContext.CONSTANTS.STORAGE.LOGIN_REQUEST);
    }
    // Check Login Status, Update UI
    var user = authContext.getCachedUser();
    if (user) {
        let sessionId = guid();
        // We are logged in. We're is good!
        window.userProfile = {
          unique_name: user.profile.upn,
          family_name: user.profile.family_name,
          given_name: user.profile.given_name,
          sessionId: sessionId
        };

        appInsights.trackEvent("login", {profileId: window.userProfile.unique_name});

        return window.userProfile;
    } else {
        // We are not logged in.  Try to login.
        authContext.login();
    }
  },
  
  getInitialGraphDataSet(datetimeSelection, timespanType){
     let formatter = Actions.constants.TIMESPAN_TYPES[timespanType];

     let url = "{0}/{1}/{2}.json".format(env_properties.OCHA_BLOB_HOSTNAME, 
                                         env_properties.TIMESERIES_BLOB,
                                         momentToggleFormats(datetimeSelection, formatter.format, formatter.blobFormat));
      
      return Rx.DOM.getJSON(url);
  },
  
  getDefaultSuggestionList(cb){
      let query = new azure.TableQuery();
      
      tableService.queryEntities(searchTermsTable, query, null, (error, result, response) => {
        if(!error) {
            let processedResults = result.entries.map(item => {
                let searchTerm = item.RowKey._.toLowerCase();
                let category = item.PartitionKey._.toLowerCase();
                
                return {category, searchTerm};
            });
            
            cb(processedResults);
        }else{
            console.error('An error occured trying to query the search terms: ' + error);
        }
      });
  },
  
  getSentimentTreeData(type, filteredValue, timespanType, dateSelection){
      let testData = [[{
          sentimentText: "Early Recovery",
          eventCount: 3000,
          nodes: [
              {
                sentimentText: "Infrastructure",
                eventCount: 1200,
                nodes: [
                        {
                            sentimentText: "damaged",
                            eventCount: 700,
                            nodes: [{
                                sentimentText: "destroyed",
                                eventCount: 500
                            }]
                        },
               ]
             },
             {
                sentimentText: "Markets",
                eventCount: 800,
                nodes: [
                        {
                            sentimentText: "functional",
                            eventCount: 500,
                            nodes: [{
                                sentimentText: "non-functional",
                                eventCount: 300
                            }]
                        },
               ]
             },
             {
                sentimentText: "Jobs",
                eventCount: 1000,
                nodes: [
                        {
                            sentimentText: "unemployment",
                            eventCount: 500,
                            nodes: [{
                                sentimentText: "youth",
                                eventCount: 300
                            }]
                        },
               ]
             }
          ]
      },
      {
          sentimentText: "Education",
          eventCount: 500,
          nodes: [
              {
                sentimentText: "Schools",
                eventCount: 100,
                nodes: [
                        {
                            sentimentText: "destroyed",
                            eventCount: 70,
                            nodes: [{
                                sentimentText: "damaged",
                                eventCount: 20
                            }]
                        },
               ]
             },
             {
                sentimentText: "Children",
                eventCount: 200,
                nodes: [
                        {
                            sentimentText: "classes",
                            eventCount: 100,
                            nodes: [{
                                sentimentText: "teachers",
                                eventCount: 0
                            }]
                        },
               ]
             },
             {
                sentimentText: "Books",
                eventCount: 1000,
                nodes: [
                        {
                            sentimentText: "materials",
                            eventCount: 500,
                            nodes: [{
                                sentimentText: "training",
                                eventCount: 100
                            }]
                        },
               ]
             }
          ]
      }]];
      
      return Rx.Observable.from(testData);
  },
  
  getTrendingKeywords: function(){
      let testData =[[{
        "id": 1,
        "trendingType": "Status",
        "trendingValue": "#women",
        "trendingTimespan": "for 5 mins",
        "trendingVolume": 33,
        "source": "twitter"
        }, {
        "id": 2,
        "trendingType": "Group",
        "trendingValue": "#women",
        "trendingTimespan": "the last hour",
        "trendingVolume": 11,
        "source": "facebook"
        }, {
        "id": 3,
        "trendingType": "Keyword",
        "trendingValue": "#refugees",
        "trendingTimespan": "for 2 hours",
        "trendingVolume": 29,
        "source": "facebook"
        }, {
        "id": 4,
        "trendingType": "Status",
        "trendingValue": "#hunger",
        "trendingTimespan": "for 4 hours",
        "trendingVolume": 16,
        "source": "twitter"
        }, {
        "id": 5,
        "trendingType": "Keyword",
        "trendingValue": "#ISIS",
        "trendingTimespan": "since 8/27/2015",
        "trendingVolume": 19,
        "source": "twitter"
        }, {
        "id": 6,
        "trendingType": "Status",
        "trendingValue": "#hunger",
        "trendingTimespan": "since 2/10/2016",
        "trendingVolume": 29,
        "source": "twitter"
        }, {
        "id": 7,
        "trendingType": "Group",
        "trendingValue": "#hunger",
        "trendingTimespan": "since 5/5/2015",
        "trendingVolume": 24,
        "source": "facebook"
        }, {
        "id": 8,
        "trendingType": "Group",
        "trendingValue": "#refugees",
        "trendingTimespan": "since 9/10/2015",
        "trendingVolume": 2,
        "source": "twitter"
        }, {
        "id": 9,
        "trendingType": "Keyword",
        "trendingValue": "#women",
        "trendingTimespan": "7/9/2015",
        "trendingVolume": 19,
        "source": "facebook"
        }, {
        "id": 10,
        "trendingType": "Group",
        "trendingValue": "#refugees",
        "trendingTimespan": "7/1/2015",
        "trendingVolume": 9,
        "source": "twitter"
        }, {
        "id": 11,
        "trendingType": "Keyword",
        "trendingValue": "#ISIS",
        "trendingTimespan": "12/22/2015",
        "trendingVolume": 19,
        "source": "twitter"
        }, {
        "id": 12,
        "trendingType": "Status",
        "trendingValue": "#hunger",
        "trendingTimespan": "9/14/2015",
        "trendingVolume": 47,
        "source": "facebook"
        }, {
        "id": 13,
        "trendingType": "Keyword",
        "trendingValue": "#refugees",
        "trendingTimespan": "8/25/2015",
        "trendingVolume": 1,
        "source": "twitter"
        }, {
        "id": 14,
        "trendingType": "Group",
        "trendingValue": "#hunger",
        "trendingTimespan": "3/26/2015",
        "trendingVolume": 41,
        "source": "facebook"
        }, {
        "id": 15,
        "trendingType": "Group",
        "trendingValue": "#displacement",
        "trendingTimespan": "9/13/2015",
        "trendingVolume": 44,
        "source": "twitter"
        }, {
        "id": 16,
        "trendingType": "Group",
        "trendingValue": "#refugees",
        "trendingTimespan": "1/5/2016",
        "trendingVolume": 14,
        "source": "twitter"
        }, {
        "id": 17,
        "trendingType": "Group",
        "trendingValue": "#refugees",
        "trendingTimespan": "10/2/2015",
        "trendingVolume": 16,
        "source": "facebook"
        }, {
        "id": 18,
        "trendingType": "Status",
        "trendingValue": "#women",
        "trendingTimespan": "1/30/2016",
        "trendingVolume": 40,
        "source": "facebook"
        }, {
        "id": 19,
        "trendingType": "Group",
        "trendingValue": "#displacement",
        "trendingTimespan": "11/28/2015",
        "trendingVolume": 50,
        "source": "facebook"
        }, {
        "id": 20,
        "trendingType": "Group",
        "trendingValue": "#displacement",
        "trendingTimespan": "6/12/2015",
        "trendingVolume": 37,
        "source": "facebook"
        }]];
      
      return Rx.Observable.from(testData);
  },
  
  getActivityEvents: function(categoryValue, categoryType, timespanType, dateSelection){
      let testData =[[{
        "id": 1,
        "name": "Kathy Wood",
        "source": "facebook",
        "timeLabel": "1 hour ago",
        "eventSubSource": "AP",
        "sentence": "@RealBenCarson</a> says he will never forgive <a href='#'>@HillaryClinton</a> for <a href='#'>#Benghazi</a>",
        "dataType": "comment",
        "messageTitle": "Refugees Fleeing Bengazi",
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a3.jpg"
        }, {
        "id": 2,
        "name": "Lisa Bell",
        "source": "facebook",
        "timeLabel": "2 hours ago",
        "eventSubSource": "AP",
        "sentence": "Vestibulum rutrum rutrum neque.",
        "dataType": "comment",
        "messageTitle": "Hunger Hits Tripoli",
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 3,
        "name": "Samuel Dunn",
        "source": "facebook",
        "timeLabel": "2 hours ago",
        "eventSubSource": "BBC",
        "sentence": "Fusce consequat.",
        "dataType": "comment",
        "messageTitle": "ISIS attack in Benghazi",
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/profile.jpg"
        }, {
        "id": 4,
        "name": "Philip Price",
        "source": "facebook",
        "timeLabel": "4 hours ago",
        "eventSubSource": "Al Jazeera",
        "sentence": "Integer non velit. Donec diam neque, vestibulum eget, vulputate ut, ultrices vel, augue. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec pharetra, magna vestibulum aliquet ultrices, erat tortor sollicitudin mi, sit amet lobortis sapien sapien non mi.",
        "dataType": "comment",
        "messageTitle": "Water Famine Continues",
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 5,
        "name": "Linda Nguyen",
        "source": "twitter",
        "timeLabel": "1:33 PM",
        "eventSubSource": "AP",
        "sentence": "Etiam justo. Etiam pretium iaculis justo. In hac habitasse platea dictumst.",
        "dataType": "post",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a5.jpg"
        }, {
        "id": 6,
        "name": "Heather Freeman",
        "source": "twitter",
        "timeLabel": "2:30 AM",
        "eventSubSource": "AP",
        "sentence": "Donec dapibus. Duis at velit eu est congue elementum. In hac habitasse platea dictumst.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 7,
        "name": "Diane Hernandez",
        "source": "twitter",
        "timeLabel": "3:05 AM",
        "eventSubSource": "AP",
        "sentence": "Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus vestibulum sagittis sapien.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 8,
        "name": "Jennifer Willis",
        "source": "facebook",
        "timeLabel": "5:47 AM",
        "eventSubSource": "AP",
        "sentence": "Morbi non lectus.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 9,
        "name": "Maria Porter",
        "source": "twitter",
        "timeLabel": "2:03 AM",
        "eventSubSource": "Al Jazeera",
        "sentence": "Nulla ac enim. In tempor, turpis nec euismod scelerisque, quam turpis adipiscing lorem, vitae mattis nibh ligula nec sem.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 10,
        "name": "Walter Chapman",
        "source": "twitter",
        "timeLabel": "9:18 AM",
        "eventSubSource": "Libyan Times",
        "sentence": "Morbi non lectus. Aliquam sit amet diam in magna bibendum imperdiet.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 11,
        "name": "Kathleen Nelson",
        "source": "twitter",
        "timeLabel": "2:16 PM",
        "eventSubSource": "Al Jazeera",
        "sentence": "In tempor, turpis nec euismod scelerisque, quam turpis adipiscing lorem, vitae mattis nibh ligula nec sem. Duis aliquam convallis nunc. Proin at turpis a pede posuere nonummy.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 12,
        "name": "Bruce Day",
        "source": "facebook",
        "timeLabel": "11:20 PM",
        "eventSubSource": "AP",
        "sentence": "Nulla facilisi.",
        "dataType": "post",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 13,
        "name": "Lawrence Parker",
        "source": "facebook",
        "timeLabel": "6:49 AM",
        "eventSubSource": "Al Jazeera",
        "sentence": "Nullam porttitor lacus at turpis. Donec posuere metus vitae ipsum. Aliquam non mauris.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 14,
        "name": "Johnny Ruiz",
        "source": "facebook",
        "timeLabel": "7:55 AM",
        "eventSubSource": "AP",
        "sentence": "Morbi ut odio.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://www.material-ui.com/images/ok-128.jpg"
        }, {
        "id": 15,
        "name": "Ashley Fernandez",
        "source": "facebook",
        "timeLabel": "3:39 PM",
        "eventSubSource": "Al Jazeera",
        "sentence": "Fusce lacus purus, aliquet at, feugiat non, pretium quis, lectus.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 16,
        "name": "Bonnie Wells",
        "source": "facebook",
        "timeLabel": "2:32 PM",
        "eventSubSource": "AP",
        "sentence": "Aliquam augue quam, sollicitudin vitae, consectetuer eget, rutrum at, lorem.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 17,
        "name": "Barbara Montgomery",
        "source": "twitter",
        "timeLabel": "4:28 PM",
        "eventSubSource": "Al Jazeera",
        "sentence": "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 18,
        "name": "Marie Mitchell",
        "source": "twitter",
        "timeLabel": "12:27 AM",
        "eventSubSource": "BBC",
        "sentence": "Donec dapibus. Duis at velit eu est congue elementum. In hac habitasse platea dictumst.",
        "dataType": "post",
        "messageTitle": false,
        "avatar": "http://www.material-ui.com/images/ok-128.jpg"
        }, {
        "id": 19,
        "name": "Doris Garcia",
        "source": "facebook",
        "timeLabel": "8:11 AM",
        "eventSubSource": "BBC",
        "sentence": "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Proin interdum mauris non ligula pellentesque ultrices.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 20,
        "name": "Gregory Warren",
        "source": "facebook",
        "timeLabel": "11:18 AM",
        "eventSubSource": "BBC",
        "sentence": "Maecenas ut massa quis augue luctus tincidunt. Nulla mollis molestie lorem.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 21,
        "name": "Samuel Fisher",
        "source": "facebook",
        "timeLabel": "8:38 AM",
        "eventSubSource": "AP",
        "sentence": "Fusce posuere felis sed lacus. Morbi sem mauris, laoreet ut, rhoncus aliquet, pulvinar sed, nisl. Nunc rhoncus dui vel sem.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 22,
        "name": "Theresa Wilson",
        "source": "twitter",
        "timeLabel": "7:15 PM",
        "eventSubSource": "Al Jazeera",
        "sentence": "Aliquam erat volutpat. In congue.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 23,
        "name": "Jeremy Sims",
        "source": "twitter",
        "timeLabel": "1:58 PM",
        "eventSubSource": "BBC",
        "sentence": "Nunc purus.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 24,
        "name": "Bonnie Carr",
        "source": "twitter",
        "timeLabel": "10:29 AM",
        "eventSubSource": "BBC",
        "sentence": "Etiam faucibus cursus urna.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 25,
        "name": "Richard Ortiz",
        "source": "facebook",
        "timeLabel": "1:13 PM",
        "eventSubSource": "Libyan Times",
        "sentence": "Curabitur in libero ut massa volutpat convallis.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 26,
        "name": "Martin Cunningham",
        "source": "twitter",
        "timeLabel": "4:39 PM",
        "eventSubSource": "Al Jazeera",
        "sentence": "Suspendisse ornare consequat lectus. In est risus, auctor sed, tristique in, tempus sit amet, sem.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 27,
        "name": "Henry Perkins",
        "source": "facebook",
        "timeLabel": "6:37 PM",
        "eventSubSource": "AP",
        "sentence": "Morbi a ipsum. Integer a nibh.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://www.material-ui.com/images/ok-128.jpg"
        }, {
        "id": 28,
        "name": "Jennifer Rodriguez",
        "source": "twitter",
        "timeLabel": "9:54 PM",
        "eventSubSource": "Libyan Times",
        "sentence": "Nunc purus. Phasellus in felis.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 29,
        "name": "Bonnie Coleman",
        "source": "facebook",
        "timeLabel": "1:27 PM",
        "eventSubSource": "AP",
        "sentence": "Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus.",
        "dataType": "tweet",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }, {
        "id": 30,
        "name": "Ralph Frazier",
        "source": "facebook",
        "timeLabel": "9:23 PM",
        "eventSubSource": "BBC",
        "sentence": "Suspendisse potenti. Cras in purus eu magna vulputate luctus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.",
        "dataType": "comment",
        "messageTitle": false,
        "avatar": "http://webapplayers.com/inspinia_admin-v2.4/img/a2.jpg"
        }]];
      
      return Rx.Observable.from(testData);
  },
  
  getHeatmapTiles: function(categoryType, timespanType, categoryValue, datetimeSelection, tileId){
    let formatter = Actions.constants.TIMESPAN_TYPES[timespanType];
    
    let url = "{0}/{1}/{2}/{3}/{4}/{5}.json".format(env_properties.OCHA_BLOB_HOSTNAME, 
                                       env_properties.EMOTIONMAPS_BLOB,
                                       categoryType.toLowerCase(),
                                       categoryValue,
                                       momentToggleFormats(datetimeSelection, formatter.format, formatter.blobFormat),
                                       tileId);
                                            
    return Rx.DOM.getJSON(url);
  },
}