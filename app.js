var app = angular.module('app', [
  'ngRoute',
  'ngMaterial',
  'slickCarousel',
  'wavemusic',
  'ngcTableDirective',
  'angular-jqcloud'
//  'material-design-iconfont'
]);

// Setup the filter
app.filter('dateFilter', function() {

  // Create the return function and set the required parameter name to **input**
  return function(response,numOfDays) {

          var output = [];
          var current = new Date();
          var daysInMilli = 1000 * 3600 * 24;

          angular.forEach(response, function(value, key) {
                var date = new Date(value.lastPlayed);
                if (angular.isNumber(numOfDays)) {
                      var timeDiff = Math.abs(current.getTime() - date.getTime());
                      var diffDays = Math.ceil(timeDiff / daysInMilli);
                      if (numOfDays <= diffDays) {
                        this.push(value);
                      }
                }
                else {
                var day = Math.abs(current.getDate() - date.getDate());
                    var isMatch = false;
                    if (numOfDays == "Today" && (day == 0)) {
                        isMatch = true;
                    } else if (numOfDays == "Yesterday" && (day == 1)) {
                        isMatch = true;
                    } else if (numOfDays == "Week" && (day <= 7 && day != 0 && day != 1)) {
                            isMatch = true;
                    } else if (numOfDays == "Month" && (day <= 30 && day > 7)) {
                        isMatch = true;
                    } else {

                    }
                    if (isMatch) {
                        this.push(value);
                    }
                }
            }, output);
    return output;
  }
  });

app.filter('mmss', function($filter, $log) {
    return function(duration) {

        if (angular.isDefined(duration)) {
            var time = new Date(0, 0, 0, 0, 0, duration, 0)
            var output = $filter('date')(time, "mm:ss");
            return output;
        } else {
            return '';
        }
    };
});

  app.directive('progressbar', [function() {
      return {
          restrict: 'A',
              scope: {
              'progress': '=progressbar'
          },
          controller: function($scope, $element, $attrs) {
              $element.progressbar({
                  value: $scope.progress
              })

              $scope.$watch(function() {
                   $element.progressbar({value: $scope.progress})
              })
          }
      }
  }])



app.controller('SplashScreenController',[
    '$scope',
    '$location',
    '$rootScope',
    '$timeout',
    '$waveMusicFactory',
    function($scope, $location, $rootScope, $timeout, $waveMusicFactory){

        $scope.progress = 0;
        $waveMusicFactory.openDashboard(function() {}, function() {});

        $scope.$on('gotoDashboard', function (event) {
            $timeout(function() {
                $location.path('/dashboard').replace();
            });
        });

        $scope.$on('progressUpdate', function (event, progress) {
            $scope.progress = progress;
//            console.log(progress);
            $scope.$digest();
        });

    }
]);


   app.controller('SearchController',[
      '$scope',
      '$location',
      '$rootScope',
      '$window',
      '$filter',
      function($scope, $location,$rootScope, $window, $filter) {

        activate();

        $scope.text = "";

        $scope.clearSearch = function () {
        $scope.text = "";
        };


        function activate() {
            $scope.text = $rootScope.searchText;
            $rootScope.searchTracks=[];
        }
        $scope.searchClick=function() {
          $scope.showSearch = !$scope.showSearch;
          $rootScope.showSearch =$scope.showSearch;
          $location.path('/searchResultPage');
//          console.log("Search rootscope: " + $rootScope.searchText);
//          console.log("Search scope: " + $scope.text);
        };

        $scope.backClicked =function() {
          $scope.showSearch = !$scope.showSearch;
          $location.path('/dashboard').replace();

//          $window.history.back();
        };

        $scope.submitSearch =function() {
//            console.log("search submit");
            if ($scope.text != "")
            {

                //Tracks VM
                $rootScope.searchTracks = [];
                $rootScope.searchTracksVM = {};
                $rootScope.searchTracksVM.local = [];
                $rootScope.searchTracksVM.soundcloud = [];
                $rootScope.searchTracksVM.jamendo = [];

                //Artists
                $rootScope.searchArtists = [];
                $rootScope.searchArtistsVM = {};
                $rootScope.searchArtistsVM.local = [];
                $rootScope.searchArtistsVM.jamendo = [];

                $scope.getJamendoTracks($scope.text);
                $scope.getJamendoArtists($scope.text);
                $scope.getSoundCloudTracks($scope.text);
                $scope.getLocalTracks($scope.text);
                $scope.getLocalArtists($scope.text);
                //$rootScope.$digest();
            }
        };

        $scope.getLocalTracks = function(query)
        {
            var source = $rootScope.tracks;
            var results = $filter('filter')(source, {$:query},false);
            if (angular.isDefined($rootScope.searchTracksVM.local))
                $rootScope.searchTracksVM.local = $rootScope.searchTracksVM.local.concat(results);
            else
                $rootScope.searchTracksVM.local = results;

        };

        $scope.getLocalArtists = function(query)
        {
            var source = $rootScope.artists;
            var results = $filter('filter')(source, {$:query},false);
            if (angular.isDefined($rootScope.searchArtistsVM.local))
                $rootScope.searchArtistsVM.local = $rootScope.searchArtistsVM.local.concat(results);
            else
                $rootScope.searchArtistsVM.local = results;
            $rootScope.$digest();
        };

        $scope.getJamendoArtists = function(query) {
            JamendoResolver.search(
            {
                query: query,
                type: "artist",
                limit: 30,
                page: 0,
                onResponse: function (results) {
                    console.log("got artists result");
                    if (angular.isDefined($rootScope.searchArtistsVM.jamendo))
                        $rootScope.searchArtistsVM.jamendo = $rootScope.searchArtistsVM.jamendo.concat(results);
                    else
                        $rootScope.searchArtistsVM.jamendo = results;
                    updateArtists();
                }
            });

        };

        $scope.getJamendoTracks = function(query) {
            JamendoResolver.search(
            {
                query: query,
                type: "track",
                limit: 30,
                page: 0,
                onResponse: function (results) {
                    if (angular.isDefined($rootScope.searchTracksVM.jamendo))
                        $rootScope.searchTracksVM.jamendo = $rootScope.searchTracksVM.jamendo.concat(results);
                    else{
                        $rootScope.searchTracksVM.jamendo = results;
                    }
                    //$rootScope.$digest();
                    //updateTracks();
                }
           });
        };

        $scope.getSoundCloudTracks = function(query){
            SoundCloudResolver.search(
            {
                query: query,
                type: "track",
                limit: 30,
                page: 0,
                onResponse: function (results) {
                    if (angular.isDefined($rootScope.searchTracksVM.soundcloud))
                        $rootScope.searchTracksVM.soundcloud = $rootScope.searchTracksVM.soundcloud.concat(results);
                    else{
                        $rootScope.searchTracksVM.soundcloud = results;
                    }
                    updateTracks();

               }
            });
        };

        var updateTracks = function()
        {
            var l = 0, j = 0, sc = 0;
            var local = $rootScope.searchTracksVM.local;
            var jamendo = $rootScope.searchTracksVM.jamendo;
            var soundcloud = $rootScope.searchTracksVM.soundcloud;

//            console.log("tracks count before: " + $rootScope.searchTracks.length);
//            console.log("local count: " + local.length);
//            console.log("Jamendo count: " + jamendo.length);
//            console.log("soundcloud count: " + soundcloud.length);


            while (l < local.length
                || j < jamendo.length
                || sc < soundcloud.length)
            {
//                console.log("l: " + l + " j: " + j + " sc: " + sc);

                //Local
                if (l != local.length)
                    $rootScope.searchTracks.push(local[l++]);
                if (l != local.length)
                    $rootScope.searchTracks.push(local[l++]);

                //SoundCloud
                if (sc != soundcloud.length)
                    $rootScope.searchTracks.push(soundcloud[sc++]);
                if (sc != soundcloud.length)
                    $rootScope.searchTracks.push(soundcloud[sc++]);

                //Jamendo
                if (j != jamendo.length)
                    $rootScope.searchTracks.push(jamendo[j++]);

            }

//            console.log("tracks count after: " + $rootScope.searchTracks.length);
            $rootScope.$digest();

        };

        var updateArtists = function()
        {
            var l = 0, j = 0;
            var local = $rootScope.searchArtistsVM.local;
            var jamendo = $rootScope.searchArtistsVM.jamendo;

//            console.log("tracks count before: " + $rootScope.searchArtists.length);
//            console.log("local count: " + local.length);
//            console.log("Jamendo count: " + jamendo.length);


            while (l < local.length
                || j < jamendo.length)
            {
                console.log("l: " + l + " j: " + j + " sc: " + sc);

                //Local
                if (l != local.length)
                    $rootScope.searchArtists.push(local[l++]);
                if (l != local.length)
                    $rootScope.searchArtists.push(local[l++]);

                //Jamendo
                if (j != jamendo.length)
                    $rootScope.searchArtists.push(jamendo[j++]);

            }

//            console.log("artists count after: " + $rootScope.searchTracks.length);
            $rootScope.$digest();

        };

      }

    ]);

  app.directive('waveMusicSearch',function() {
    return {
      scope: {},
      templateUrl: 'template/header.html',
      controller: 'SearchController',
      controllerAs: 'searchBar',
      bindToController:true

    };

//    return directive;
  });





app.controller('DashboardController', [
  '$rootScope',
  '$scope',
  '$http',
  '$log',
  '$location',
  '$timeout',
  '$filter',
  '$waveMusicFactory',
  '$mdMedia',
  '$route',
  'tracks',
  function($rootScope, $scope, $http, $log, $location, $timeout, $filter, $waveMusicFactory, $mdMedia, $route, tracks) {


        $scope.$watch("allTracks.length", function(newValue, oldValue) {
              $log.info(newValue, oldValue);
              if (newValue > 0) {
                $timeout(function() {
                  $scope.loadTracks = false;
                  $log.info("in");
                  $scope.loadTracks = true;
                });
              }
         });

        $log.info("tracks");
        $log.info(tracks);
        $scope.allTracks = tracks;
        $rootScope.tracks = $scope.allTracks;

//        $log.info("artists");
//        $log,info(artists);
//        $scope.artists =artists;
//        $rootScope.artists = $scope.artists;
//
//
//        $scope.$watch("artists.length", function(newValue, oldValue){
//            $log.info(newValue, oldValue);
//            if(newValue > 0){
//                $timeout(function(){
//                    $scope.loadArtists = false;
//                    $log.info("artists in");
//                    $scope,loadArtists = true;
//                });
//            }
//
//        });


    $scope.$on('onlineIndexingCompleted', function (event) {
        $timeout(function() {
            $route.reload();
            //$location.path('/dashboard').replace();
        });
    });
     $scope.$on('trackingInfo', function (event, type, size) {
          $timeout(function() {

    //            $scope.type = type;
    //            $scope.size = size;
            $scope.tracks = $rootScope.tracks;
            $scope.artists = $rootScope.artists;
            $scope.albums = $rootScope.albums;

            if (type == 1) {
                $scope.trackSize = size;
            } else if(type == 2) {
                $scope.albumSize = size;
            } else if(type == 4) {
                $scope.artistSize = size;
            }

          });
        });


    var DateStart;
    $scope.initialize = function() {
    DateStart = new Date();
    $rootScope.showSearch = false;
    $rootScope.searchTracks =[];
    $rootScope.searchArtists=[];
    $rootScope.searchAlbums=[];
    $rootScope.searchGenres=[];
    $rootScope.searchDecadeGenres=[];

    if ($mdMedia('xs'))
        $rootScope.jqFontSize = "{from:0.13, to:0.08}";
    else if ($mdMedia('sm'))
            $rootScope.jqFontSize = "{from:0.09, to:0.05}";
    else if ($mdMedia('md'))
        $rootScope.jqFontSize = "{from:0.06, to:0.03}";
    else if ($mdMedia('gt-md'))
        $rootScope.jqFontSize = "{from:0.05, to:0.02}";
    else
        $rootScope.jqFontSize = "{from:0.06, to:0.03}";
    $scope.jqFontSize = $rootScope.jqFontSize;

    // For reference
//      $scope.isScanning = true;
      $scope.currentIndex = 0;
      $scope.slickConfig = {
        event: {
          afterChange: function (event, slick, currentSlide, nextSlide) {
            $scope.currentIndex = currentSlide; // save current index each time
          },
          init: function (event, slick) {
            // slide to correct index when init,
            // second for animation by default animatied(true)
            var DateEnd = new Date();
//            $log.info("DATESTART", DateEnd - DateStart);
            slick.slickGoTo($scope.currentIndex,true);
          }
        }
      };
//
//      $scope.getArtists();
//      $scope.getAllAlbums();
//      $scope.getGenres();
//      $scope.getDecadeGenres();
//      $scope.getAllFavorites();
//      $scope.getRecentlyAdded();
//      $scope.getAllRecentlyPlayed();
//      $scope.getAllTracks();
    };
    $scope.searchIconClicked=function() {
       $location.path('/searchResultPage');
    };

    $scope.isMusicFound = function() {
        return $scope.artists === undefined
        && $scope.albums === undefined && $scope.genres === undefined
        && $scope.favorites === undefined && $scope.recents === undefined
        && $scope.recentPlayed ===undefined;
    }

    $scope.getArtists = function() {
//        if ($scope.artists.length == 0) {
          $waveMusicFactory.getArtists()
          .then(function(response) {
            var artists = $filter('orderBy')(response.artists, "weight", true);
            //console.log("artists response: " + JSON.stringify(response));
            $rootScope.artists = artists;
            $scope.artists = angular.copy(artists);
            }, function(error) {
              $log.error("Error fetching Artists: " + error);
           });
//        }

    };

    $scope.getAllAlbums=function() {
        $waveMusicFactory.getAllAlbums()
          .then(function(response) {
//          console.log("album json",response);

            var albums = $filter('orderBy')(response.albums, "weight", true);  //descendimg order by weight
            $rootScope.albums = albums;
            $scope.albums = albums;
          }, function(error) {
           $log.error("Error fetching Artists: " + error);
          });
    };

    $scope.getAllFavorites=function() {
        $waveMusicFactory.getAllFavorites()
          .then(function(response) {
            $scope.favorites = response;
            $rootScope.favorites = response;
//            $log.info("Favorite:console " + angular.toJson(response, true));
          }, function(error) {
           $log.error("Error fetching Artists: " + error);
          });
    };

    $scope.getRecentlyAdded=function(response) {
        var filterRecents = $filter('orderBy')(response, "lastModified", true); //descendimg order by weight
        $scope.recents = filterRecents;
        $timeout(function() {
        });
        $rootScope.recents = filterRecents;
    };

    $scope.getAllRecentlyPlayed = function() {
            $waveMusicFactory.getAllRecentlyPlayed()
            .then(function(response){

                var filterRecentsPlayed = $filter('orderBy')(response, "lastPlayed", true); //descendimg order by weight
    //            console.log("filter Recents",filterRecents);
                $scope.recentsPlayed = filterRecentsPlayed;
                $rootScope.recentsPlayed = filterRecentsPlayed;

             }, function(error) {
               $log.error("Error fetching Recents: " + error);
            });
    };
    $scope.getAllTracks = function() {
        $waveMusicFactory.getAllTracks()
        .then(function(response) {
        // console.log("tracks all",response);
        $scope.getRecentlyAdded(response);//call to getrecentlyAdded
        var filterTracks = $filter('orderBy')(response,"name",true);
        $scope.allTracks = filterTracks;
        $rootScope.tracks = $scope.allTracks
//        $log.info("tracks",angular.toJson($rootScope.tracks));
        $scope.search();
        })
    };


     $scope.search = function(){
            $scope.songs = $rootScope.tracks;
            $scope.genres = $rootScope.allgenres;
            $scope.decades = $rootScope.allgenresDecade;


            var array = [];

              angular.forEach($scope.songs, function(element) {
                array.push(element.name, element.albumname, element.artistname);
              });

              angular.forEach($scope.genres, function(element) {
               array.push(element.text);
              });

              angular.forEach($scope.decades, function(element) {
               array.push(element.text);
//               $log.info("3");
              });
//              $log.info("Searched arrays",JSON.stringify(array));


    //          $log.info("Searched",JSON.stringify(array));
              $('#search').typeahead({source: array});
           };



    $scope.genreSelected = function(genre) {
        $rootScope.selectedGenre = genre;
        // redirect to genre page
        $timeout(function() {
          $location.path('/genre');
        });
    };
    $scope.getGenres = function() {
        $waveMusicFactory.getGenres()
        .then(function(response) {
            var genres = response.genres;
            $rootScope.allgenres = response.genres; //All genres
            $scope.filterGenres = $filter('orderBy')(genres, "weight", true); //descendimg order by weight
//            $log.info("Genre Response",angular.toJson($scope.filterGenres));

            $scope.genres = $filter('limitTo')($scope.filterGenres, 5, 0); //top 5 genres;
            $rootScope.topgenres = $scope.genres; //top 5 genres;


            angular.forEach($scope.genres, function(genre, key) {

                genre.handlers = {
                    click: function() {
                    $scope.genreSelected(genre);

                    }

                }
            });
        }, function(error) {
        $log.error("Error fetching Genres: " + error);
        });
    };


   $scope.getDecadeGenres = function() {
     $waveMusicFactory.getDecadeGenres()
       .then(function(response) {
//            $log.info("Ashish decade",response);
         var oderByDecade = $filter('orderBy')(response.decades, "weight", true);
         $scope.genresDecade = $filter('limitTo')(oderByDecade, 5, 0);

         $rootScope.allgenresDecade = response.decades;
          $rootScope.topDecades = $scope.genresDecade;     //top 5 genres;

         angular.forEach($rootScope.topDecades, function(genre, key) {
             genre.handlers = {
               click: function() {

                 $scope.genreDecadeSelected(genre);
               }
             }
          });
       }, function(error) {
         $log.error("Error fetching Genres: " + error);
       });
   };

   $scope.genreDecadeSelected = function(genre) {
     $rootScope.selectedGenreDecade = genre;
     // redirect to genre page
     $timeout(function() {
       $location.path('/decadegenre');
     });
   };

   $scope.getArtistsPictures = function() {
      angular.forEach($scope.artists, function(artist, key) {
        $waveMusicFactory.getArtistsImage(artist.name)
          .then(function(artistInfo) {
            // $log.info(response);
            $scope.setProfileImage(artist, artistInfo);

            artist.biography = artistInfo.bio();
//            $log.info(artist.biography);
           });
       });
    };


     $scope.setProfileImage = function(artist, artistInfo) {
        //$log.info("setProfileIamge"+JSON.stringify(response)+ JSON.stringify(artist));
        var thumbImagePath,imagePath;
        if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().first() != undefined) {
              thumbImagePath = artistInfo.profilePhoto().first().url();

        }
        if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().last() != undefined) {
          imagePath = artistInfo.profilePhoto().last().url();
        }

        artist.imagePath = thumbImagePath;
        artist.largeImagePath = imagePath;
     };

   $scope.openArtist = function(index) {
//     console.log("Position: " + index);
//     console.log("Selected Artist: " + angular.toJson($scope.artists[index], true));

     if($scope.currentIndex == index) {
       $rootScope.position = index;
       $rootScope.artist = $scope.artists[index];
       $location.path('/artist');
     }

   };

    $scope.openAlbum = function(index) {

        if($scope.currentIndex == index) {
           $rootScope.position = index;
           $rootScope.album = $scope.albums[index];
           $location.path('/album');
        }
    };

    $scope.openFavorite = function(index) {

        if($scope.currentIndex ==index) {
          $scope.favorite = $scope.favorites[index];
          if($scope.favorite.type === "album") {
            $rootScope.album = $scope.favorite;
            $rootScope.position = $scope.getPositionOfFavoriteAlbum($scope.favorite);
            $location.path('/album');
          } else if($scope.favorite.type === "track") {
            //todo: for track
          } else{
            //todo: for Plalist
          }
        }
    };


    $scope.getPositionOfFavoriteAlbum = function(favoriteAlbum) {

        for(var i=0;i<$scope.albums.length;i++) {
            if(favoriteAlbum.name === $scope.albums[i].name) {
                return i;
            }
        }
        return -1;
    };

    $scope.initialize();
//    $timeout(function() {
//     $scope.initialize();
//    },10);
  }
]);


function prepareData(items, pages, rows, cols) {
    var count = 0;
    var output = [];
    var index = 0;
    for (var i = 0; i<pages && count < items.length; i++) {
    output.push([]);
        for (var j = 0; j < rows && count < items.length; j++) {
        output[i].push([]);
            for (var k = 0; k < cols && count < items.length; k++) {
                var item = items[i * rows * cols + j * cols + k];
//            console.log("item: ", item);
                item.index = index++;
                output[i][j][k] = item;
                count++;
            }
        }
    }
return output;
}

app.controller('ArtistsController',[
    '$rootScope',
    '$scope',
    '$log',
    '$location',
    '$waveMusicFactory',
    function($rootScope, $scope, $log, $location, $waveMusicFactory) {


      $scope.allArtistsConfig = {
          event: {
            afterChange: function (event, slick, currentSlide, nextSlide) {
            $scope.currentIndex = currentSlide;
            //do
            },
            init: function (event, slick) {
            }
          }
      };

      $scope.initialize = function() {
        var artists = [];
        if($rootScope.showSearch) {
            artists = $rootScope.searchArtists;
        }else {
            artists = $rootScope.artists;
        }


        var toolbarHeight = 48;
        var padding = 24;
        var cellheight = 48;

        $scope.height = $(window).height() - toolbarHeight - padding;
        $scope.width = Math.floor(($(window).width() - padding) / 233);
        $scope.rows = Math.floor($scope.height / cellheight) - 1;
        $scope.cols = Math.ceil(artists.length / $scope.rows);
        $scope.pages = Math.ceil(artists.length / ($scope.rows * $scope.width));
        $scope.artistss = prepareData(artists, $scope.pages, $scope.rows, $scope.width);
        $scope.cellFormat = function(data, row, col) {
        return data;
      };
      };

      // Connected via ng-cells callback click-fn
      $scope.openArtist = function(event, cellData) {
        var index = cellData.data.index;
//        console.log("Selected Index: " + index);
        $rootScope.position = index;
        if($rootScope.showSearch) {
            $rootScope.searchArtist = $rootScope.searchArtists[index];
        }else {
            $rootScope.artist = $rootScope.artists[index];
        }
        $location.path('/artist');
      };

      $scope.initialize();
    }
]);

app.controller('ArtistController', [
  '$rootScope',
  '$scope',
  '$log',
  '$timeout',
  '$filter',
  '$location',
  '$waveMusicFactory',
  function($rootScope, $scope, $log, $timeout,$filter, $location, $waveMusicFactory) {
    $scope.initialize = function() {
        //console.log("Artist controller: check");
        if($rootScope.showSearch){
            $scope.artist = $rootScope.searchArtist;
            $scope.artists = $rootScope.searchArtists;
            $rootScope.artists = $scope.artists;

        }
        else{
           $scope.artist = $rootScope.artist;
           $scope.artists = $rootScope.artists;
           $rootScope.artists = $scope.artists;

        }
                //         For reference
              $scope.currentArtistIndex = $rootScope.position;
              $scope.slickArtistConfig = {
                event: {
                     afterChange: function (event, slick, currentSlide, nextSlide) {
                        $scope.currentArtistIndex = currentSlide;
                        $scope.artist = $scope.artists[currentSlide];
                        $rootScope.artist = $scope.artist;
                        $scope.getAlbumForArtist();
                        $scope.getTrack();
                        $scope.getArtistInfo();

                     },
                     init: function (event, slick) {
                        // slide to correct index when init,
                        // second for animation by default animatied(true)
                        slick.slickGoTo($scope.currentArtistIndex,true);
                     }
                }
              };
              //for Album Focus and position
              $scope.slickConfig = {
                     event: {
                         afterChange: function (event, slick, currentSlide, nextSlide) {
                            $scope.currentIndex = currentSlide;

                         },
                         init: function (event, slick) {
                             // slide to correct index when init,
                            // second for animation by default animatied(true)
                            slick.slickGoTo($scope.currentIndex,true);
                         }
                     }
              };

              $scope.allTracksConfig = {
                event: {
                  afterChange: function (event, slick, currentSlide, nextSlide) {
                  $scope.currentIndex = currentSlide;
                  //do
                  },
                  init: function (event, slick) {
                  }
                }
              };
              $scope.getArtistInfo();
              $scope.getAlbumForArtist();
              $scope.getTrack();

              $scope.$watch(function(scope){ return scope.tracks;},
                function(newValue, oldValue)
                {
                    if (angular.isDefined(newValue))
                        $scope.renderTracks(newValue);
                }
              );
                //for Albums
//              $scope.$watch(function(scope){ return scope.album;},
//                function(newValue, oldValue)
//                {
//                    console.log("artists updated: ");
//                    console.log("artists new: " + JSON.stringify(newValue));
//                    console.log("artists old: " + JSON.stringify(oldValue));
//                    $scope.searchArtists = newValue;
//
//                }
//              );



    };

              $scope.openArtist = function(index) {
                    if($scope.currentIndex == index) {
                         $rootScope.position = index;
                         $rootScope.artist = $scope.artists[index];
                         $location.path('/artist');
                     }
              };


              $scope.openAlbum = function(index){

                    if($scope.currentIndex == index) {
                        $rootScope.position = index;
                        $rootScope.album = $scope.albums[index];
                        $location.path('/album');
                    }

              }
              $scope.renderTracks=function(tracks) {
                  var toolbarHeight = 48;
                  var padding = 24;
                  var cellheight = 48;

                  $scope.height = $(window).height() - toolbarHeight - padding;
                  $scope.width = Math.floor(($(window).width() - padding) / 233);

                  $scope.rows = 4;
                  $scope.cols = Math.ceil(tracks.length / $scope.rows);
                  $scope.pages = Math.ceil(tracks.length / ($scope.rows * $scope.width));
                  $scope.trackss = prepareData(tracks, $scope.pages, $scope.rows, $scope.width);
              };

              $scope.getTrack=function() {
                  if($rootScope.showSearch) {
                  var results = $filter('filter')($rootScope.tracks, {'artistname':$scope.artist.name},true);
                  $scope.tracks = results;
//                  $scope.$digest();
                  if ($scope.artist.source = "jamendo"){
                      JamendoResolver.search(
                          {
                              query: $scope.artist.name,
                              type: "track",
                              limit: 30,
                              page: 0,
                              onResponse: function (results) {
                                  if (angular.isDefined($scope.tracks))
                                      $scope.tracks = $scope.tracks.concat(results);
                                  else{
                                      $scope.tracks = results;
                                  }

                              }
                         }
                      );
                  }
                  $rootScope.searchTracks = $scope.tracks



                  }else {
                        $waveMusicFactory.getPlaylist($scope.artist)
                        .then(function(response) {
                            console.log("track for album: " + JSON.stringify(response));
                             var tracks = response;
                             $rootScope.tracks = response;
                             $scope.renderTracks(tracks);
                        }, function(error){
                           $log.error(error);
                        });
                  }

              };
              /*
              click function is from track-cell.html
              */
              $scope.playTrack =function(event,cellData) {
               var index = cellData.data.index;
//               console.log("Selected Index: " + index);
//              $log.info("track","clicked");
                $scope.track = $rootScope.tracks[index];
//                $log.info("platTrack data",JSON.stringify($scope.track));
                $waveMusicFactory.playTrack($scope.track)
                 .then(function(response) {
//                 $log.info("Added data");


                 },function(error){
                 $log.error(error);
                 });
              };

              $scope.getAlbumForArtist = function() {
                $waveMusicFactory.getAlbumForArtist($scope.artist)
                      .then(function(response) {
                        var albums = $filter('orderBy')(response.albums, "weight", true);  //descendimg order by weight

                        $scope.albums = albums
                        $rootScope.albums = albums;

                         $scope.dataLoadedArtistAlbum = true;
                        $timeout(function() {
                          $scope.dataLoadedArtistAlbum = false;
                          $scope.albums = angular.copy(response.albums);
                          $timeout(function() {
                            $scope.albums = angular.copy(response.albums);
                            $scope.dataLoadedArtistAlbum = true;
                          });
                                    });


                      }, function(error) {
                        $log.error(error);
                      });

              };

              $scope.getArtistInfo = function() {
                $waveMusicFactory.getArtistsImage($scope.artist.name)
                .then(function(artistInfo) {
                  $rootScope.artistInfo =null;
                  $rootScope.artistInfo = artistInfo;
                    $scope.artist.biography = artistInfo.bio();
//                   $log.info("ArtistInfo factcard",JSON.stringify(artistInfo));

                });
              };


//              $scope.setProfileImage = function(artist, artistInfo) {
//                  var imagePathLarge,imagePath;
//                    if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().first() != undefined) {
//                        imagePathLarge = (artistInfo.profilePhoto().first().url()!=null ? artistInfo.profilePhoto().first().url() :$scope.artist.imagePath);
//
//                        }
//                    if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().last() != undefined) {
//                        imagePath = (artistInfo.profilePhoto().last().url()!=null ? artistInfo.profilePhoto().last().url() :$scope.artist.imagePath);
//                        }
//
//                    artist.imagePathLarge = imagePathLarge;
//                    artist.imagePath = imagePath;
//              };


            // Initialization
            $scope.initialize();

  }
]);

app.controller('ArtistInfoController', [
  '$rootScope',
  '$scope',
  '$log',
  function($rootScope, $scope, $log) {

    $scope.initialize = function() {

      $scope.artist = $rootScope.artist;
      //$rootScope.artist = $scope.artist;
      $rootScope.position = $rootScope.artists.indexOf($scope.artist);
      $scope.artistInfo = $rootScope.artistInfo;
//      $log.info("factcardinfo",$scope.artistInfo.factCard());
      $scope.factCard = $scope.artistInfo.factCard();
      $scope.initFact();
    };

    $scope.initFact = function() {
      $scope.infos = [];

      // BirthDate
      $scope.infos.push({ "key":"Birth Date", "value": $scope.factCard.birthdate });
      // Birth place
      $scope.infos.push({ "key":"Born", "value": $scope.factCard.birthplace });
      // Labels
      if ($scope.factCard.labels != undefined) {
        $scope.infos.push({ "key":"Labels", "value": $scope.factCard.labels.toString() });
      }
      // Associated Acts
      if ($scope.factCard.associatedActs != undefined) {
        $scope.infos.push({ "key":"Associated Acts", "value": $scope.factCard.associatedActs.toString() });
      }
      // Website
       if ($scope.factCard.website != undefined) {
      $scope.infos.push({ "key":"Website", "value": $scope.factCard.website });
       }
    };

    $scope.initialize();
  }
]);

app.controller('AlbumsController',[
    '$rootScope',
    '$scope',
    '$log',
    '$location',
    '$waveMusicFactory',
    function($rootScope, $scope, $log, $location, $waveMusicFactory) {

      $scope.initialize = function() {
        var albums = $rootScope.albums;
           var toolbarHeight = 48;
           var padding = 24;
           var cellheight = 48;

           $scope.height = $(window).height() - toolbarHeight - padding;
           $scope.width = Math.floor(($(window).width() - padding) / 233);

//           $scope.rows = 4;
           $scope.rows = Math.floor($scope.height / cellheight) - 1;
           $scope.cols = Math.ceil(albums.length / $scope.rows);
           $scope.pages = Math.ceil(albums.length / ($scope.rows * $scope.width));

           $scope.albumss = prepareData(albums, $scope.pages, $scope.rows, $scope.width);
           $scope.cellFormat = function(data, row, col) {
           return data;
         };

      };

      $scope.openAlbum = function(event, cellData) {
              var index = cellData.data.index;
//              console.log("Selected Index: " + index);
              $rootScope.position = index;
              $rootScope.album = $rootScope.albums[index];
              $location.path('/album');
            };

//      $scope.openAlbum=function(index){
//        console.log("position of album in all",index);
//        $rootScope.position = index;
//        $rootScope.album = $scope.albums[index];
//        $location.path('/album');
//      };

      $scope.initialize();
    }
]);
app.controller('AlbumController', [
  '$rootScope',
  '$scope',
  '$log',
  '$waveMusicFactory',
  function($rootScope, $scope, $log, $waveMusicFactory) {

    $scope.initialize = function() {
      $scope.tracks={};
      $scope.album = $rootScope.album;
      $scope.albums = $rootScope.albums;

      $scope.getAlbumTrack();
      $scope.currentAlbumIndex = $rootScope.position;

     $scope.slickAlbumConfig = {
        event: {
          afterChange: function (event, slick, currentSlide, nextSlide) {
          $scope.album = $scope.albums[currentSlide];
          $scope.getAlbumTrack();

        },
        init: function (event, slick) {
            // slide to correct index when init,
            // second for animation by default animatied(true)
            slick.slickGoTo($scope.currentAlbumIndex,true);
          }
        }
     };
/*
            to toggle loved Album
        */
        $scope.isFavourite = false;
//        console.log("favorite response",$scope.isFavourite);
        $scope.toggleFavourite = function() {
            $scope.isFavourite = !$scope.isFavourite;
            $scope.type = "artist";
            $waveMusicFactory.toggledFavoriteAlbum($scope.album,$scope.isFavourite)
            .then(function(response) {
                },function(error) {
                  $log.error(error);

                }
            );
        };
    };

    $scope.renderTracks =function(tracks) {
     var toolbarHeight = 48;
         var padding = 24;
         var cellheight = 48;

         $scope.height = $(window).height() - toolbarHeight - padding;
         $scope.width = Math.floor(($(window).width() - padding) / 233);

         $scope.rows = 4;
         $scope.cols = Math.ceil(tracks.length / $scope.rows);
         $scope.pages = Math.ceil(tracks.length / ($scope.rows * $scope.width));
         $scope.trackss = prepareData(tracks, $scope.pages, $scope.rows, $scope.width);

         $scope.cellFormat = function(data, row, col) {
          return data;
         };

    };

    $scope.getAlbumTrack = function() {
        $waveMusicFactory.getAlbumTracks($scope.album)
            .then(function(response) {
//            $log.info("local album track",response);
            $rootScope.tracks = response;
            $scope.tracks = response;
            $scope.renderTracks($scope.tracks);
            $scope.getAlbumTrackOnline();
        },function(error) {
                 $log.error("Error: " + error);
        });
    };
    $scope.getAlbumTrackOnline = function() {
            $waveMusicFactory.getOnlineAlbumTracks($scope.album)
                .then(function(response) {

                if(angular.isDefined(response)) {
                    var onlineTracks = response;
//                $log.info("online album track response",angular.toJson(response));
                  $scope.tracks = $scope.tracks.concat(onlineTracks);
                  $rootScope.tracks = $rootScope.tracks.concat(response);
                  $scope.renderTracks($scope.tracks);
                }
                },function(error){
                  $log.error("Error: " + error);
                }
            );
    };

    $scope.playTrack =function(event,cellData) {
       var index = cellData.data.index;
        $scope.track = $rootScope.tracks[index];
        $waveMusicFactory.playTrack($scope.track)
         .then(function(response) {
         },function(error){
         $log.error(error);
         });
    };

     $scope.initialize();
  }
]);

app.controller('GenreController',[
  '$rootScope',
  '$scope',
  '$log',
  '$location',
  '$timeout',
  '$waveMusicFactory',
  function($rootScope, $scope, $log, $location, $timeout, $waveMusicFactory) {


        $scope.initialize=function() {
          var tracks = [];
          $scope.albums = [];
          $scope.artists = [];
          $scope.jqFontSize = $rootScope.jqFontSize;


          $scope.genre = $rootScope.selectedGenre;
//            $log.info("Selected Genre"+$scope.genre.text);
          $scope.genres = $rootScope.topgenres //top5 element

          $scope.slickConfig = {
            event: {
              afterChange: function (event, slick, currentSlide, nextSlide) {
                $scope.currentIndex = currentSlide; // save current index each time
              },
              init: function (event, slick) {
                // slide to correct index when init,
                // second for animation by default animatied(true)
                slick.slickGoTo($scope.currentIndex,true);

              }
            }
          };
//                      $log.info("Selected Genre");
//                      $log.info(angular.toJson($scope.genres));
          // Update handler for page refresh
          angular.forEach($scope.genres, function(genre, key) {
                      genre.html = {};
                      genre.handlers = {
                        click: function() {
                          angular.forEach($scope.genres, function(genre, key) {
                            genre.html = {};
                          });
                          genre.html = {
                            class: 'genre-active'
                          };
                          $('#genres').jQCloud('update', $scope.genres); // updates word cloud
                          $scope.genreSelected(genre); // update genre details
                        }
                      };

                      if (genre == $scope.genre) {
                        genre.html = {
                          class: 'genre-active'
                        }
                      }
          });

          $scope.getGenreTracks();
          $scope.getGenreAlbums();
          $scope.getGenreArtists();

    }
        $scope.genreSelected = function(genre) {
              $rootScope.selectedGenre = genre;
              $scope.genre = genre;  //selected genre from genre page

              $scope.getGenreTracks();
              $scope.getGenreAlbums();
              $scope.getGenreArtists();
        }

        $scope.getGenreTracks = function() {
              $waveMusicFactory.getGenreTracks($scope.genre)
                .then(function(genreTracks) {
                  var tracks = genreTracks;
                  $rootScope.tracks = genreTracks;
//                    $log.info("Genre Tracks: " + JSON.stringify(genreTracks));

                  $scope.tracks = angular.copy(genreTracks).splice(0, 4);

                      var toolbarHeight = 48;
                       var padding = 24;
                       var cellheight = 48;

                       $scope.height = $(window).height() - toolbarHeight - padding;
                       $scope.width = Math.floor(($(window).width() - padding) / 233);

                       $scope.rows = 4;
              //           $scope.rows = Math.floor($scope.height / cellheight) - 1;
                       $scope.cols = Math.ceil(tracks.length / $scope.rows);
                       $scope.pages = Math.ceil(tracks.length / ($scope.rows * $scope.width));
                       $scope.trackss = prepareData(tracks, $scope.pages, $scope.rows, $scope.width);

                       $scope.cellFormat = function(data, row, col) {
                       return data;
                     };
                },
                function(error) {
                  $log.error("Error: " + error);
                });
        };

         $scope.playTrack =function(event,cellData) {
                           var index = cellData.data.index;
                           //console.log("Selected Index: " + index);
//                          $log.info("track","clicked");
                            $scope.track = $rootScope.tracks[index];
        //                    $log.info("platTrack data",JSON.stringify($scope.track));
                            $waveMusicFactory.playTrack($scope.track)
                             .then(function(response) {
//                             $log.info("Added data");


                             },function(error){
                             $log.error(error);
                             });
               };


        $scope.getGenreAlbums = function() {
          $waveMusicFactory.getGenreAlbums($scope.genre)
            .then(function(albumsresponse) {
//            $log.info("Genre Albums: " + JSON.stringify(albumsresponse));
              $rootScope.albums = albumsresponse.albums;
              $scope.albums = albumsresponse.albums;

              $scope.dataLoadedGenreAlbum = true;
              $timeout(function() {
                $scope.dataLoadedGenreAlbum = false;
                $scope.albums = angular.copy(albumsresponse.albums);
                $timeout(function() {
                  $scope.albums = angular.copy(albumsresponse.albums);
//                  $scope.getArtistsPictures();

                  $scope.dataLoadedGenreAlbum = true;
                });
              });
            },
            function(error) {
              $log.error("Error: " + error);
            });
        };

        $scope.getGenreArtists = function() {
          $waveMusicFactory.getGenreArtists($scope.genre)
            .then(function(artistsresponse) {
//            $log.info("Ashish","genre Artist response"+angular.toJson(artistsresponse.artists));
               $rootScope.artists = artistsresponse.artists;
              $scope.artists = artistsresponse.artists;

              $scope.dataLoadedGenreArtist = true;
                $timeout(function() {
                  $scope.dataLoadedGenreArtist = false;
                  $scope.artists = angular.copy(artistsresponse.artists);
                  $timeout(function() {
                  $scope.artists= angular.copy(artistsresponse.artists);
                  $scope.dataLoadedGenreArtist = true;
                  });
                });
            },
            function(error) {
              $log.error("Error: " + error);
            });
        };

//        $scope.getArtistsPictures = function() {
//              angular.forEach($scope.artists, function(artist, key) {
//                $waveMusicFactory.getArtistsImage(artist.name)
//                  .then(function(artistInfo) {
//                    $scope.setProfileImage(artist, artistInfo);
//
////                    artist.biography = artistInfo.bio();
//                   });
//               });
//            };
//
//
//         $scope.setProfileImage = function(artist, artistInfo) {
//            //$log.info("setProfileIamge"+JSON.stringify(response)+ JSON.stringify(artist));
//            var thumbImagePath,imagePath;
//            if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().first() != undefined) {
//                  thumbImagePath = artistInfo.profilePhoto().first().url();
//
//            }
//            if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().last() != undefined) {
//              imagePath = artistInfo.profilePhoto().last().url();
//            }
//
//            artist.imagePath = thumbImagePath;
//            artist.largeImagePath = imagePath;
//         };

        $scope.openAlbum = function(index) {
          if($scope.currentIndex == index) {
            $rootScope.position = index;
            $rootScope.album = $scope.albums[index];
            $location.path('/album');
          }

        }

        $scope.openArtist = function(index) {
          if($scope.currentIndex == index) {
             $rootScope.position = index;
             $rootScope.artist = $scope.artists[index];
             $location.path('/artist');
          }
        }
        $scope.initialize();
  }
]);

app.controller('GenreTracksController', [
  '$scope',
  '$rootScope',
  '$log',
  function($scope, $rootScope, $log) {
    $scope.initialize = function() {

    if($rootScope.showSearch) {
      var tracks = $rootScope.searchTracks;
            }else {
      var tracks = $rootScope.tracks;
            }

      $scope.jqFontSize = $rootScope.jqFontSize;

      $scope.rightSongs = [];
      $scope.leftSongs  = [];

         var toolbarHeight = 48;
         var padding = 24;
         var cellheight = 48;

         $scope.height = $(window).height() - toolbarHeight - padding;
         $scope.width = Math.floor(($(window).width() - padding) / 233);

//         $scope.rows = 4;
         $scope.rows = Math.floor($scope.height / cellheight) - 1;
         $scope.cols = Math.ceil(tracks.length / $scope.rows);
         $scope.pages = Math.ceil(tracks.length / ($scope.rows * $scope.width));

         $scope.trackss = prepareData(tracks, $scope.pages, $scope.rows, $scope.width);

         $scope.cellFormat = function(data, row, col) {
         return data;
       };
};

         $scope.playTrack =function(event,cellData) {
           var index = cellData.data.index;
//           console.log("Selected Index: " + index);
//          $log.info("track","clicked");
            $scope.track = $rootScope.tracks[index];
//                    $log.info("platTrack data",JSON.stringify($scope.track));
            $waveMusicFactory.playTrack($scope.track)
             .then(function(response) {
//             $log.info("Added data");


             },function(error){
             $log.error(error);
             });
          };

    $scope.initialize();
  }
]);

app.controller('DecadeGenreController',[
  '$rootScope',
  '$scope',
  '$log',
  '$location',
  '$timeout',
  '$waveMusicFactory',
  function($rootScope, $scope, $log, $location, $timeout, $waveMusicFactory) {

    $scope.initialize=function() {
          var tracks = [];
          $scope.albums = [];
          $scope.artists = [];
          $scope.jqFontSize = $rootScope.jqFontSize;

          $scope.decadeGenre = $rootScope.selectedGenreDecade; // selected decadegenre from dashboard
          $scope.genresDecade = $rootScope.topDecades; //top 5 decades

//          $scope.currentIndex = 0;
          $scope.slickConfig = {
              event: {
                afterChange: function (event, slick, currentSlide, nextSlide) {
                  $scope.currentIndex = currentSlide; // save current index each time
                },
                init: function (event, slick) {
                  // slide to correct index when init,
                  // second for animation by default animatied(true)
                  slick.slickGoTo($scope.currentIndex,true);
                }
              }
          };
          // Update handler for page refresh
          angular.forEach($scope.genresDecade, function(genre, key) {
                      genre.html = {};
                      genre.handlers = {
                        click: function() {
                        angular.forEach($scope.genresDecade, function(genre, key) {
                                genre.html = {};
                              });
                              genre.html = {
                                class: 'decade-genre-active'
                              };
                              $('#decadegenre').jQCloud('update', $scope.genresDecade); // updates word cloud
                              $scope.genreDecadeSelected(genre);
                            }
                         };
                          if (genre == $scope.decadeGenre) {
                                  genre.html = {
                                    class: 'decade-genre-active'
                                  }
                              }
                         },true);
          $scope.getDecadeGenreTracks();
          $scope.getDecadeGenreAlbums();
          $scope.getDecadeGenreArtists();
    }

    $scope.genreDecadeSelected = function(genre) {
          $rootScope.selectedGenreDecade = genre; //selected genre from genre page
          $scope.decadeGenre = genre;  //selected genre from genre page

          $scope.getDecadeGenreTracks();
          $scope.getDecadeGenreAlbums();
          $scope.getDecadeGenreArtists();
    }

    $scope.getDecadeGenreTracks = function() {
      $waveMusicFactory.getDecadeGenreTracks($scope.decadeGenre)
        .then(function(response) {
          var tracks = response;
          $rootScope.tracks = response;
//          $log.info("Decade Tracks: " + JSON.stringify(response));
           var toolbarHeight = 48;
           var padding = 24;
           var cellheight = 48;

           $scope.height = $(window).height() - toolbarHeight - padding;
           $scope.width = Math.floor(($(window).width() - padding) / 233);

           $scope.rows = 4;
  //           $scope.rows = Math.floor($scope.height / cellheight) - 1;
           $scope.cols = Math.ceil(tracks.length / $scope.rows);
           $scope.pages = Math.ceil(tracks.length / ($scope.rows * $scope.width));


           $scope.trackss = prepareData(tracks, $scope.pages, $scope.rows, $scope.width);

        },
        function(error) {
          $log.error("Error: " + error);
        });
    };

     $scope.playTrack =function(event,cellData) {
                       var index = cellData.data.index;
//                       console.log("Selected Index: " + index);
//                      $log.info("track","clicked");
                        $scope.track = $rootScope.tracks[index];
    //                    $log.info("platTrack data",JSON.stringify($scope.track));
                        $waveMusicFactory.playTrack($scope.track)
                         .then(function(response) {
//                         $log.info("Added data");


                         },function(error){
                         $log.error(error);
                         });
         };


$scope.getDecadeGenreAlbums = function() {
      $waveMusicFactory.getDecadeGenreAlbums($scope.decadeGenre)
        .then(function(albumsresponse) {
//          $log.info("Decade Albums: " + JSON.stringify(albumsresponse));
          $rootScope.albums = albumsresponse.albums;
          $scope.albums = albumsresponse.albums;

          $scope.dataLoadedGenreAlbum = true;
          $timeout(function() {
            $scope.dataLoadedGenreAlbum = false;
            $scope.albums = angular.copy(albumsresponse.albums);
            $timeout(function() {

              $scope.albums = angular.copy(albumsresponse.albums);
              $scope.albums.push(albumsresponse.albums);
//              $scope.getArtistsPictures();
              $scope.dataLoadedGenreAlbum = true;
            });
          });
        },
        function(error) {
          $log.error("Error: " + error);
        });
    };

    $scope.getDecadeGenreArtists = function() {
      $waveMusicFactory.getDecadeGenreArtists($scope.decadeGenre)
        .then(function(artistsresponse) {
//          $log.info("Decade Artists: " + JSON.stringify(artistsresponse));
          $rootScope.artists=artistsresponse.artists;
          $scope.artists = artistsresponse.artists;

          $scope.dataLoadedGenreArtist = true;
            $timeout(function() {
              $scope.dataLoadedGenreArtist = false;
              $scope.artists = angular.copy(artistsresponse.artists);
              $timeout(function() {
              $scope.artists= angular.copy(artistsresponse.artists);
              $scope.dataLoadedGenreArtist = true;
              });
            });
        },
        function(error) {
          $log.error("Error: " + error);
        });
    };




    $scope.getArtistsPictures = function() {
      angular.forEach($scope.artists, function(artist, key) {
        $waveMusicFactory.getArtistsImage(artist.name)
          .then(function(artistInfo) {
//             $log.info(response);
            $scope.setProfileImage(artist, artistInfo);

            artist.biography = artistInfo.bio();
//            $log.info(artist.biography);
           });
       });
    };

     $scope.setProfileImage = function(artist, artistInfo) {
        //$log.info("setProfileIamge"+JSON.stringify(response)+ JSON.stringify(artist));
        var thumbImagePath,imagePath;
        if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().first() != undefined) {
              thumbImagePath = artistInfo.profilePhoto().first().url();

        }
        if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().last() != undefined) {
          imagePath = artistInfo.profilePhoto().last().url();
        }
        artist.imagePath = thumbImagePath;
        artist.largeImagePath = imagePath;
     };
    $scope.openAlbum = function(index) {
     if($scope.currentIndex == index) {
        $rootScope.position = index;
        $rootScope.album = $scope.albums[index];
        $location.path('/album');
     }
    }

    $scope.openArtist = function(index) {
     if($scope.currentIndex == index) {
       $rootScope.position = index;
       $rootScope.artist = $scope.artists[index];
       $location.path('/artist');
     }
    }
    $scope.initialize();
  }
]);
app.controller('AllGenresController', [
  '$rootScope',
  '$scope',
  '$log',
  '$filter',
  '$timeout',
  '$location',
   function($rootScope, $scope, $log, $filter, $timeout,  $location) {

        $scope.genres = $rootScope.allgenres;
        $scope.jqFontSize = $rootScope.jqFontSize;

        var oderByGenres = $filter('orderBy')($scope.genres, "weight", true);  //descendimg order by weight
         $scope.limitTogenres = $filter('limitTo')(oderByGenres, 5, 0); //top 5 genres;
//        $rootScope.topgenres = limitTogenres;     //top 5 genres;

        angular.forEach($scope.genres, function(genre, key) {
          genre.handlers = {
            click: function() {
            genre.afterWordRender = function(){
            this.addClass('selectedGenre');
            }
              $scope.genreSelected(genre);
              $scope.selectedGenreposition = key;
//              $log.info("genre position ",$scope.selectedGenreposition);
              if($scope.selectedGenreposition < 2 ) {
                      $rootScope.topgenres = $scope.limitTogenres;
//                      $log.info("genre ",$rootScope.topgenres);
              } else if($scope.selectedGenreposition > $scope.genres.length-1) {
                         var genres=[];
                         genres.push($scope.genres[length - 1]);
                         genres.push($scope.genres[length - 2]);
                         genres.push($scope.genres[length - 3]);
                         genres.push($scope.genres[length - 4]);
                         genres.push($scope.genres[length - 5]);
                         $rootScope.topgenres = genres;
//                         $log.info("genre else last element",$rootScope.topgenres);

              } else {
                          var genres=[];
                          genres.push($scope.genres[$scope.selectedGenreposition - 2]);
                          genres.push($scope.genres[$scope.selectedGenreposition - 1]);
                          genres.push($scope.genres[$scope.selectedGenreposition]);
                          genres.push($scope.genres[$scope.selectedGenreposition + 2]);
                          genres.push($scope.genres[$scope.selectedGenreposition + 1]);
                          $rootScope.topgenres = genres
//                          $log.info("genre else ",$rootScope.topgenres);

              }
            }
          }
        });

        $scope.genreSelected = function(genre) {
          $rootScope.selectedGenre = genre;
          // redirect to genre page
          $timeout(function() {
            $location.path('/genre');
          });
        };
   }
]);
app.controller('AllDecadeGenresController', [
  '$rootScope',
  '$scope',
  '$log',
  '$filter',
  '$timeout',
  '$location',
   function($rootScope, $scope, $log, $filter, $timeout,  $location) {

        $scope.genres = $rootScope.allgenresDecade;
        $scope.jqFontSize = $rootScope.jqFontSize;
        var oderByGenres = $filter('orderBy')($scope.genres, "weight", true);  //descendimg order by weight
        $scope.limitToGenres = $filter('limitTo')(oderByGenres, 5, 0); //top 5 genres;

        angular.forEach($scope.genres, function(genre, key) {
          genre.handlers = {
            click: function() {
              $scope.genreDecadeSelected(genre);
              $scope.selectedDecadeposition = key;
//              $log.info("genre position ",$scope.selectedDecadeposition);
              if($scope.selectedDecadeposition < 2 ) {
                    $rootScope.topDecades = $scope.limitTogenres;
//                    $log.info("genre ",$rootScope.topDecades);
              } else if($scope.selectedDecadeposition > $scope.genres.length-1) {
                       var genres=[];
                       genres.push($scope.genres[length - 1]);
                       genres.push($scope.genres[length - 2]);
                       genres.push($scope.genres[length - 3]);
                       genres.push($scope.genres[length - 4]);
                       genres.push($scope.genres[length - 5]);
                       $rootScope.topDecades = genres;
//                       $log.info("genre else last element",$rootScope.topDecades);

              } else {
                        var genres=[];
                        genres.push($scope.genres[$scope.selectedDecadeposition - 2]);
                        genres.push($scope.genres[$scope.selectedDecadeposition - 1]);
                        genres.push($scope.genres[$scope.selectedDecadeposition]);
                        genres.push($scope.genres[$scope.selectedDecadeposition + 2]);
                        genres.push($scope.genres[$scope.selectedDecadeposition + 1]);
                        $rootScope.topDecades = genres
//                        $log.info("genre else ",$rootScope.topDecades);
              }


            }
          }
        });

       $scope.genreDecadeSelected = function(genre) {
            $rootScope.selectedGenreDecade = genre;
            // redirect to genre page
            $timeout(function() {
              $location.path('/decadegenre');
            });
          };
   }
]);
app.controller('AllFavoritesController', [
  '$rootScope',
  '$scope',
  '$log',
  '$filter',
  '$timeout',
  '$location',
  '$waveMusicFactory',
   function($rootScope, $scope, $log, $filter, $timeout,  $location, $waveMusicFactory) {

   $scope.initialize = function() {
           $rootScope.position = 0;

           var favorites = $rootScope.favorites;
//           $log.info("All Albums" + JSON.stringify(favorites));
              var toolbarHeight = 48;
              var padding = 24;
              var cellheight = 48;

              $scope.height = $(window).height() - toolbarHeight - padding;
              $scope.width = Math.floor(($(window).width() - padding) / 233);

              $scope.rows = Math.floor($scope.height / cellheight) - 1;
              $scope.cols = Math.ceil(favorites.length / $scope.rows);
              $scope.pages = Math.ceil(favorites.length / ($scope.rows * $scope.width));

              $scope.favoritess = prepareData(favorites, $scope.pages, $scope.rows, $scope.width);

              $scope.cellFormat = function(data, row, col) {
              return data;
            };

         };

         $scope.openAlbum = function(event, cellData) {
                 var index = cellData.data.index;
//                 console.log("Selected Index: " + index);
                 $rootScope.position = $scope.getPositionOfFavoriteAlbum(cellData);
                 $rootScope.album = $rootScope.favorites[index];
                 $location.path('/album');
               };

               $scope.getPositionOfFavoriteAlbum = function(cellData) {
                for(var i=0;i<$scope.albums.length;i++) {
                    if(cellData.data.name === $rootScope.albums[i].name)
                        return i;
                }
                return -1;
               }

         $scope.initialize();
       }
]);

app.controller('AllRecentlyAddedController', [
  '$rootScope',
  '$scope',
  '$log',
  '$filter',
  '$timeout',
  '$location',
  '$waveMusicFactory',
   function($rootScope, $scope, $log, $filter, $timeout,  $location, $waveMusicFactory) {

   $scope.initialize = function() {


      var recents = $rootScope.recents;
//      $log.info("All Albums" + JSON.stringify(recents));
      var toolbarHeight = 48;
      var padding = 24;
      var cellheight = 48;

      $scope.height = $(window).height() - toolbarHeight - padding;
      $scope.width = Math.floor(($(window).width() - padding) / 233);

      $scope.rows = Math.floor($scope.height / cellheight) - 1;
      $scope.cols = Math.ceil(recents.length / $scope.rows);
      $scope.pages = Math.ceil(recents.length / ($scope.rows * $scope.width));

      $scope.recentss = prepareData(recents, $scope.pages, $scope.rows, $scope.width);

      $scope.cellFormat = function(data, row, col) {
      return data;
    };

 };
    $scope.playTrack =function(event,cellData) {
                var index = cellData.data.index;
                console.log("Selected Index: " + index);
//               $log.info("track","clicked");
                 $scope.track = $rootScope.tracks[index];
//                 $log.info("platTrack data",JSON.stringify($scope.track));
                 $waveMusicFactory.playTrack($scope.track)
                  .then(function(response) {
//                  $log.info("Added data");


                  },function(error){
                  $log.error(error);
                  });
         };

         $scope.initialize();
       }
]);

app.controller('AllRecentlyPlayedController', [
  '$rootScope',
  '$scope',
  '$log',
  '$filter',
  '$waveMusicFactory',
   function($rootScope, $scope, $log, $filter, $waveMusicFactory) {

       $scope.initialize = function() {

            var recentPlayed = $rootScope.recentsPlayed;

            var yesterdayTracks = $filter('dateFilter')(recentPlayed,'Yesterday');
            var todayTracks = $filter('dateFilter')(recentPlayed,'Today');
            var weekTracks = $filter('dateFilter')(recentPlayed,'Week');
            var monthTracks = $filter('dateFilter')(recentPlayed,'Month');
            $scope.yesterday(yesterdayTracks);
            $scope.week(weekTracks);
            $scope.month(monthTracks);
            $scope.today(todayTracks);


       };
       $scope.today = function(todayTracks) {
          var toolbarHeight = 48;
          var padding = 24;
          var cellheight = 48;

          $scope.height = $(window).height() - toolbarHeight - padding;
          $scope.width = Math.floor(($(window).width() - padding) / 233);
          $scope.rows = Math.floor($scope.height / cellheight) - 1;
          $scope.cols = Math.ceil(todayTracks.length / $scope.rows);
          $scope.pages = Math.ceil(todayTracks.length / ($scope.rows * $scope.width));
          $scope.lastTodayPlayed = prepareData(todayTracks, $scope.pages, $scope.rows, $scope.width);

          $scope.cellFormat = function(data, row, col) {
            return data;
          };


       };
       $scope.yesterday=function(yesterdayTracks) {
          var toolbarHeight = 48;
          var padding = 24;
          var cellheight = 48;

          $scope.height = $(window).height() - toolbarHeight - padding;
          $scope.width = Math.floor(($(window).width() - padding) / 233);
          $scope.rows = Math.floor($scope.height / cellheight) - 1;
          $scope.cols = Math.ceil(yesterdayTracks.length / $scope.rows);
          $scope.pages = Math.ceil(yesterdayTracks.length / ($scope.rows * $scope.width));
          $scope.lastYesterdayPlayed = prepareData(yesterdayTracks, $scope.pages, $scope.rows, $scope.width);
          $scope.cellFormat = function(data, row, col) {
          return data;
       };

       };
       $scope.week=function(weekTracks) {
              var toolbarHeight = 48;
              var padding = 24;
              var cellheight = 48;

              $scope.height = $(window).height() - toolbarHeight - padding;
              $scope.width = Math.floor(($(window).width() - padding) / 233);
              $scope.rows = Math.floor($scope.height / cellheight) - 1;
              $scope.cols = Math.ceil(weekTracks.length / $scope.rows);
              $scope.pages = Math.ceil(weekTracks.length / ($scope.rows * $scope.width));
              $scope.lastWeekPlayed = prepareData(weekTracks, $scope.pages, $scope.rows, $scope.width);
              $scope.cellFormat = function(data, row, col) {
              return data;
              };

       };
       $scope.month=function(monthTracks) {
            var toolbarHeight = 48;
            var padding = 24;
            var cellheight = 48;

            $scope.height = $(window).height() - toolbarHeight - padding;
            $scope.width = Math.floor(($(window).width() - padding) / 233);
            $scope.rows = Math.floor($scope.height / cellheight) - 1;
            $scope.cols = Math.ceil(monthTracks.length / $scope.rows);
            $scope.pages = Math.ceil(monthTracks.length / ($scope.rows * $scope.width));
            $scope.lastMonthPlayed = prepareData(monthTracks, $scope.pages, $scope.rows, $scope.width);
            $scope.cellFormat = function(data, row, col) {
            return data;
          };

       };
       $scope.initialize();


   }
]);

app.controller('SearchResultPage', [
  '$rootScope',
  '$scope',
  '$http',
  '$log',
  '$location',
  '$timeout',
  '$filter',
  '$waveMusicFactory',
  function($rootScope, $scope, $http, $log, $location, $timeout, $filter, $waveMusicFactory) {

    $scope.initialize = function() {

      // For reference
//      $scope.isScanning = true;
      $scope.currentIndex = 0;
      $scope.slickConfig = {
        event: {
          afterChange: function (event, slick, currentSlide, nextSlide) {
            $scope.currentIndex = currentSlide; // save current index each time
          },
          init: function (event, slick) {
            // slide to correct index when init,
            // second for animation by default animatied(true)
            slick.slickGoTo($scope.currentIndex,true);
          }
        }
      };


        $rootScope.$watch(function(scope){ return scope.searchTracks;},
            function(newValue, oldValue)
            {
                console.log("tracks updated");
                if (angular.isDefined(newValue))
                    $scope.renderTracks(newValue);
            },true);

        $rootScope.$watch(function(scope){ return scope.searchArtists;},
            function(newValue, oldValue)
            {
//                console.log("artists updated: ");
//                console.log("artists new: " + JSON.stringify(newValue));
//                console.log("artists old: " + JSON.stringify(oldValue));
                $scope.searchArtists = newValue;

            },true);


     };



    $scope.getOnlineAlbums=function() {
        $waveMusicFactory.getOnlineAlbums()
          .then(function(response) {
//          console.log("album json",response);

            var albums = $filter('orderBy')(response.albums, "weight", true);  //descendimg order by weight
            $rootScope.albums = albums;
            $scope.albums = albums;
          }, function(error) {
           $log.error("Error fetching Artists: " + error);
          });
    };



    $scope.renderTracks=function(tracks) {
        var toolbarHeight = 48;
        var padding = 24;
        var cellheight = 48;

        $scope.height = $(window).height() - toolbarHeight - padding;
        $scope.width = Math.floor(($(window).width() - padding) / 233);

        $scope.rows = 4;
        $scope.cols = Math.ceil(tracks.length / $scope.rows);
        $scope.pages = Math.ceil(tracks.length / ($scope.rows * $scope.width));
        $scope.trackss = prepareData(tracks, $scope.pages, $scope.rows, $scope.width);
    };



    $scope.genreSelected = function(genre) {
        $rootScope.selectedGenre = genre;
        // redirect to genre page
        $timeout(function() {
          $location.path('/genre');
        });
    };


    $scope.getOnlineGenres = function() {
        $waveMusicFactory.getOnlineGenres()
        .then(function(response) {
          var genres = response.genres;
//          console.log("Genre Json",angular.toJson(genres));
          $rootScope.allgenres = response.genres;   //All genres
          $scope.oderByGenres = $filter('orderBy')(genres, "weight", true);  //descendimg order by weight
          $scope.genres = $filter('limitTo')($scope.oderByGenres, 5, 0); //top 5 genres;
          $rootScope.topgenres = $scope.genres;     //top 5 genres;

          angular.forEach($scope.genres, function(genre, key) {

            genre.handlers = {
              click: function() {
                $scope.genreSelected(genre);

              }

                 // selected genre
            }
          });
        }, function(error) {
            $log.error("Error fetching Genres: " + error);
        });
    };

   $scope.getOnlineDecadeGenres = function() {
     $waveMusicFactory.getOnlineDecadeGenres()
       .then(function(response) {
         var oderByDecade = $filter('orderBy')(response.decades, "weight", true);
         $scope.genresDecade = $filter('limitTo')(oderByDecade, 5, 0);

         $rootScope.allgenresDecade = response.decades;
          $rootScope.topDecades = $scope.genresDecade;     //top 5 genres;

         angular.forEach($rootScope.topDecades, function(genre, key) {
             genre.handlers = {
               click: function() {

                 $scope.genreDecadeSelected(genre);
               }
             }
          });
       }, function(error) {
         $log.error("Error fetching Genres: " + error);
       });
   };

   $scope.genreDecadeSelected = function(genre) {
     $rootScope.selectedGenreDecade = genre;
     // redirect to genre page
     $timeout(function() {
       $location.path('/decadegenre');
     });
   };

   $scope.getArtistsPictures = function() {
      angular.forEach($scope.artists, function(artist, key) {
        $waveMusicFactory.getArtistsImage(artist.name)
          .then(function(artistInfo) {
            // $log.info(response);
            $scope.setProfileImage(artist, artistInfo);

            artist.biography = artistInfo.bio();
//            $log.info(artist.biography);
           });
       });
    };


     $scope.setProfileImage = function(artist, artistInfo) {
        //$log.info("setProfileIamge"+JSON.stringify(response)+ JSON.stringify(artist));
        var thumbImagePath,imagePath;
        if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().first() != undefined) {
              thumbImagePath = artistInfo.profilePhoto().first().url();

        }
        if (artistInfo.profilePhoto() != undefined && artistInfo.profilePhoto().last() != undefined) {
          imagePath = artistInfo.profilePhoto().last().url();
        }

        artist.imagePath = thumbImagePath;
        artist.largeImagePath = imagePath;
     };

   $scope.openArtist = function(artist) {
//     console.log("Position: " + index);
//     console.log("Selected Artist: " + angular.toJson($scope.artists[index], true));

//     if($scope.currentIndex == index) {
       $rootScope.searchArtist = artist;
       $rootScope.position = $rootScope.searchArtists.indexOf(artist);
       $location.path('/artist');
//     }

   };

//    $scope.openAlbum = function(index) {
//
//        if($scope.currentIndex == index) {
//           $rootScope.position = index;
//           $rootScope.album = $scope.albums[index];
//           $location.path('/album');
//        }
//    };

    $scope.initialize();

  }
]);

