// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

const listCover = document.getElementById('listCover');
const submit = document.getElementById('submit');
const city = document.getElementById('city');
const topic = document.getElementById('topic');
const radius = document.getElementById('radius');
const loader = document.getElementsByClassName('loading')[0];
const addItem = document.getElementsByClassName('addPickUp');
const removeItem = document.getElementsByClassName('removePickUp');
const reloader = document.getElementById('page-reload');
const form = document.getElementsByClassName('popUp')[0];
const mapCover = document.getElementsByClassName('mapCover')[0];
const lookUp = document.getElementById('lookUpButton');
const mapUp = document.getElementById('mapUpButton');
const pickUp = document.getElementById('pickUpButton');
const autocomplete = new google.maps.places.Autocomplete(city);
let previousCity = '';
let mapclicked = false;
let submitted = false;
let pickUpClicked = false;
//디자인, 마크 레이블, code convetion, refector
lookUp.addEventListener('click', function () {
    let hidden = listCover.classList.contains('hide');
    let listed = listCover.classList.contains('listMapUp');
    debugger;
    if (!hidden && !submitted) {
        listCover.classList.toggle('hide');

        if (listed) {
            listCover.classList.remove('listMapUp');
            mapCover.classList.remove('mapCover-clicked');
        }

    } else if (hidden && submitted || mapclicked) {
        listCover.classList.toggle('hide');

        if (listed) {
            listCover.classList.remove('listMapUp');
            mapCover.classList.remove('mapCover-clicked');
        }        
    }
});

mapUp.addEventListener('click', function () {
    let hidden = listCover.classList.contains('hide');
    let listed = listCover.classList.contains('listLookUp');

    if (!hidden && !mapclicked) {
        listCover.classList.toggle('hide');
        
        if (listed) {
            listCover.classList.remove('listLookUp');
            form.classList.remove('popUp-clicked');
        }

    } else if (hidden && mapclicked) {
        listCover.classList.toggle('hide');

        if (listed) {
            listCover.classList.remove('listLookUp');    
            form.classList.remove('popUp-clicked');
        }
    }
});

pickUp.addEventListener('click', function (e) {
    pickUpClicked = true;
    listCover.classList.add('listMapUp');
    mapCover.classList.add('mapCover-clicked')

    pickUpBox(e.currentTarget.id);
});

reloader.addEventListener('click', function () {
    location.reload();
});

google.maps.event.addListener(map,'click', function (e) {
    mapclicked = true;

    if (!mapCover.classList.contains('mapCover-clicked')) {
        mapCover.classList.add('mapCover-clicked');
    }

    if (topic.value.length === 0 || topic.value === undefined) {
        topic.value = 'movie';
    }

    if (radius.value.length === 0 || radius.value === undefined) {
        radius.value = 10;
    }

    if (city.value.length === 0 || radius.value === undefined) {
        city.value = 'NY';
    }

    const clickedMarker = new google.maps.Marker({
        position: e.latLng,
        map: map
    });

    clearMarker();

    markers.push(clickedMarker);

    meetUpAPI(topic.value, radius.value, {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
    });
});

submit.addEventListener('click', function () {
    submitted = true;

    if (!form.classList.contains('popUp-clicked')) {
        form.classList.add('popUp-clicked');
    }

    const geocoder = new google.maps.Geocoder();

    targetCoordinates(geocoder, map);
});

function meetUpAPI (query, radius, location) {
    if (radius % 10 !== 0 || radius === 0) {
        alert('Radius should be 10, 20, 30 miles and so on...');
        return;
    }

    if (radius > 100) {
        alert('Radius range must be 0-100 miles');
        return;
    }

    loader.classList.remove('hide');

    const address = `https://api.meetup.com/find/upcoming_events?key=175b1e495e751e6470291c431102538&photo-host=public&lon=${location.lng}&page=10&text=${query}&radius=${radius}&lat=${location.lat}`;

    return new Promise(function (resolve, reject) {
        $.ajax({
            url: address,
            dataType: 'jsonp',
            success: function (data) {
                resolve(data);
            },

            error: function (err) {
                reject(err);
            }

        }).then(function (list) {
            if (list.data.errors !== undefined) {
                loader.classList.add('hide');
                throw list.data.errors[0].message;
            }

            if (list.data.events.length === 0) {
                loader.classList.add('hide');
                throw 'No available event';
            }

            const hostList = [];

            list = list.data.events;

            for (let i = 0; i < list.length; i++) {
                hostList.push(new Promise(function (resolve) {
                    const url = `https://api.meetup.com/${list[i].group.urlname}?key=175b1e495e751e6470291c431102538&photosign=true&photo-host=public`;

                    $.ajax({
                        url: url,
                        dataType: 'jsonp',
                        success: function (result) {
                            const host = result.data.organizer;
                            const groupInfo = result.data;
                            let newData;

                            try {
                                newData = {
                                    hostName: host.name,
                                    eventId: list[i].id,
                                    photoLink: host.photo !== undefined ? host.photo.thumb_link : './assets/images/default profile.png',
                                    eventTitle: list[i].name,
                                    groupName: list[i].group.name,
                                    date: `${list[i].local_date.split('-')[1]}/${list[i].local_date.split('-')[2]}/${list[i].local_date.split('-')[0]}`,
                                    time: list[i].local_time.slice(0,2) > 12 ? `${(list[i].local_time.slice(0,2) - 12) + list[i].local_time.slice(2)} PM` : `${list[i].local_time} AM`,
                                    rsvpLimit: list[i].rsvp_limit || '00',
                                    rsvpCount: list[i].yes_rsvp_count || 0,
                                    lng: list[i].venue !== undefined ?  list[i].venue.lon : groupInfo.lon,
                                    lat: list[i].venue !== undefined ?  list[i].venue.lat : groupInfo.lat
                                };
                            } catch (e){
                                loader.classList.add('hide');
                                this.error(e);
                            }

                            resolve(newData);
                        },

                        error: function (err) {
                            reject(err);
                        }
                    });
                }));
            }

            return Promise.all(hostList);

        }).then(function (list) {
            localStorage.setItem('originData', JSON.stringify(list));

            listTemplate(list);
            clearMarker();
            createMarker(list);

            if (submitted) {
                listCover.classList.remove('mapLookUp');
                listCover.classList.add('listLookUp');     
                submitted = false;

            } else if (mapclicked) {
                listCover.classList.remove('listLookUp');
                listCover.classList.add('listMapUp');
                mapclicked = false;
            }


        }).catch(function (err) {
            alert(err);
        });
    });
}

function targetCoordinates (geocoder, map) {
    const currentCity = city.value || 'NY';
    const query = topic.value || 'movie';
    const radiusRange = radius.value || 10;
    let location;

    if (previousCity === currentCity) {
        meetUpAPI(query, radiusRange, {
            lat: map.getCenter().lat(),
            lng: map.getCenter().lng()
        });

        return;

    } else {
        previousCity = currentCity;
    }

    geocoder.geocode({'address': currentCity}, function (results, status) {
        location = results[0].geometry.location;

        if (status == 'OK') {
            map.setCenter(location);

            const marker = new google.maps.Marker({
                position: location,
                map: map
            });

            clearMarker();

            markers.push(marker);

            meetUpAPI(query, radiusRange, {
                lat: location.lat(),
                lng: location.lng()
            });

        } else {
            alert(`Error status: ${status}`);
        }
    });
}

function createMarker (list) {
    list.forEach(function (v, i) {
        setTimeout(function () {
            const place = {
                lat: list[i].lat,
                lng: list[i].lng
            };

            markers.push(new google.maps.Marker({
                position: place,
                map:map,
                animation: google.maps.Animation.DROP
            }));
        }, i * 200);
    });
}

function clearMarker() {
    markers.forEach(function(marker) {
        marker.setMap(null);
    });

    markers = [];
}

function pickUpBox (e, idx) {
    if (e === 'pickUpButton' && !idx) {
        const list = [];

        if (localStorage.originData === undefined || localStorage.length <= 2) {
            alert('Your pick up list is empty!')

            pickUpClicked = false;

            return;
        }

        for (let k in localStorage) {
            let id = k.split(' ')[0];
            
            if (id === 'id') {
                list.push(JSON.parse(localStorage[k]));
            }
        }

        listTemplate(list);
        clearMarker();
        createMarker(list);

        pickUpClicked = false;

        return;
    }

    
    let lists = [];

    if (e[0] === 'pickUp') {
        for (let k in localStorage) {
            let id = k.split(' ')[0];
            
            if (id === 'id') {
                lists.push(JSON.parse(localStorage[k]));
            }
        }

    } else if (e[0] === 'list') {
       lists = JSON.parse(localStorage.originData);
    }

    const singleList = lists[idx];    
    debugger;
    if (e[1] === 'add') {
        localStorage.setItem(`id ${singleList.eventId}`, JSON.stringify(singleList));
        addItem[idx].classList.add('hide');
        removeItem[idx].classList.remove('hide');
        
    } else if (e[1] === 'remove') {
        localStorage.removeItem(`id ${singleList.eventId}`, JSON.stringify(singleList));
        removeItem[idx].classList.add('hide');
        addItem[idx].classList.remove('hide');

    } else {
        throw new Error('Unvaild input value');
    }
}
// 즐찾 분기 애니메이션
function listTemplate (list) {
    if (!Array.isArray(list)) {
        throw new Error('List is not an Array');
    }

    const listTemplate = _.template(
        `<% _.forEach(list, function (event) { %>
            <div class="event">
                <div class="host">
                    <img class="hostPhoto" src="<%= event.photoLink %>" />
                    <span class="hostName"><%= event.hostName %></span>
                </div>
                <div class="detail">
                    <div class="eventTitle"><%= event.eventTitle %></div>
                    <div class="groupName">Group: <%= event.groupName %></div>
                    <div class="date">Date: <%= event.time %> <%= event.date %></div>
                    <div class="rsvp">RSVP: <%= event.rsvpCount %>/<%= event.rsvpLimit %></div>
                </div>
                <div class="addPickUp">
                    <i class="far fa-star"></i>
                    <span class="tooltip">Click to add</span>
                </div>
                <div class="removePickUp hide">
                    <i class="fas fa-star"></i>
                    <span class="tooltip">Click to remove</span>
                </div>
            </div>
        <% }) %>`);

    const eventList = listTemplate({list: list});

    listCover.innerHTML = eventList;

    if (pickUpClicked) {
        for (let i = 0; i < listCover.children.length; i++) {
            (function (idx) {
                addItem[i].addEventListener('click', function () {
                    pickUpBox(['pickUp', 'add'], idx);
                });
    
                removeItem[i].addEventListener('click', function () {
                    pickUpBox(['pickUp', 'remove'], idx);
                });
                
                addItem[i].classList.add('hide');
                removeItem[i].classList.remove('hide');
            })(i);
        }

        pickUpClicked = false;

    } else {
        for (let i = 0; i < listCover.children.length; i++) {
            (function (idx) {
                addItem[i].addEventListener('click', function (e) {
                    debugger;
                    pickUpBox(['list', 'add'], idx);
                });

                removeItem[i].addEventListener('click', function (e) {
                    pickUpBox(['list', 'remove'], idx);
                });
            })(i);
        }
    }

    loader.classList.add('hide');
    listCover.classList.remove('hide');
}
