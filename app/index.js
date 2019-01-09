// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

const scrollUp = document.getElementById('scrollUp');
const listCover = document.getElementById('listCover');
const submit = document.getElementById('submit');
const city = document.getElementById('city');
const topic = document.getElementById('topic');
const radius = document.getElementById('radius');
const loader = document.getElementsByClassName('loading')[0];
const addItem = document.getElementsByClassName('addfavorite');
const removeItem = document.getElementsByClassName('removefavorite');
const favoriteDisplay = document.getElementById('favoriteDisplay');
const favoriteCover = document.getElementById('favoriteCover');
const reloader = document.getElementById('page-reload');
const form = document.getElementsByClassName('popUp')[0];
const mapCover = document.getElementsByClassName('mapCover')[0];
const autocomplete = new google.maps.places.Autocomplete(city);
let previousCity = '';

reloader.addEventListener('click', function () {
    location.reload();
});

scrollUp.addEventListener('click', function () {
    window.scroll({
        top: 0,
        behavior: 'smooth'
    });
});

favoriteDisplay.addEventListener('click', function (e) {
    favoriteBox(e);
});

google.maps.event.addListener(map,'click', function (e) { // 지도 클릭
    if (!mapCover.classList.contains('mapCover-clicked')) {
        mapCover.classList.add('mapCover-clicked');
    }

    if (topic.value.length === 0 || topic.value === undefined) {
        topic.value = 'festival';
    }

    if (radius.value.length === 0 || radius.value === undefined) {
        radius.value = 10;
    }

    if (city.value.length === 0 || radius.value === undefined) {
        city.value = 'Seoul, Korea';
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

submit.addEventListener('click', function () { // submit클릭
    if (!form.classList.contains('popUp-clicked')) {
        form.classList.add('popUp-clicked');
    }

    const geocoder = new google.maps.Geocoder();

    targetCoordinates(geocoder, map);
});
//디자인, 마크 레이블, 커버페이지, code convetion, refector
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
                                    photoLink: host.photo !== undefined ? host.photo.thumb_link : './assets/images/default profile.png',
                                    eventTitle: list[i].name,
                                    groupName: list[i].group.name,
                                    date: `${list[i].local_date.split('-')[1]}/${list[i].local_date.split('-')[2]}/${list[i].local_date.split('-')[0]}`,
                                    time: list[i].local_time.slice(0,2) > 12 ? `${(list[i].local_time.slice(0,2) - 12) + list[i].local_time.slice(2)} PM` : `${list[i].local_time} AM`,
                                    rsvpLimit: list[i].rsvp_limit || '00',
                                    rsvpCount: list[i].yes_rsvp_count || 0,
                                    lng: groupInfo.lon,
                                    lat: groupInfo.lat
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

            const listTemplate = _.template(
                `<% _.forEach(list, function (event) { %>
                    <div class="event">
                        <div class="eventTitle"><%= event.eventTitle %></div>
                        <div class="host">
                            <img class="hostPhoto" src="<%= event.photoLink %>" />
                            <div class="hostName"><%= event.hostName %></div>
                        </div>
                        <div class="detail">
                            <div class="groupName"><%= event.groupName %></div>
                            <div class="date"><%= event.date %></div>
                            <div class="time"><%= event.time %></div>
                            <div class="rsvp">RSVP <%= event.rsvpCount %>/<%= event.rsvpLimit %></div>
                        </div>
                        <div class="addfavorite"><i class="fas fa-map-marked-alt"></i></div>
                        <div class="removefavorite hide"><i class="far fa-trash-alt"></i></div>
                    </div>
                <% }) %>`);

            const eventList = listTemplate({list: list});

            listCover.innerHTML = eventList;
            loader.classList.add('hide');
            // form.classList.remove('hide');

            for (let i = 0; i < listCover.children.length; i++) {
                (function (idx) {
                    addItem[i].addEventListener('click', function (e) {
                        favoriteBox(e, idx);
                    });

                    removeItem[i].addEventListener('click', function (e) {
                        favoriteBox(e, idx);
                    });
                })(i);
            }

        }).catch(function (err) {
            alert(err);
        });
    });
}

function targetCoordinates (geocoder, map) {
    const address = city.value || 'seoul';
    const query = topic.value || 'festival';
    const radiusRange = radius.value || 10;
    let location;

    if (previousCity === address) {
        meetUpAPI(query, radiusRange, {
            lat: map.getCenter().lat(),
            lng: map.getCenter().lng()
        });

        return;

    } else {
        previousCity = address;
    }

    geocoder.geocode({'address': address}, function (results, status) {
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
            alert('English keywords recommended');
        }
    });
}

function clearMarker() {
    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];
}

function favoriteBox (e, idx) {
    if (e === 'renew' || e.currentTarget.id === 'favoriteDisplay') {
        const list = [];
        const keys = Object.keys(localStorage);

        for (let i = 0; i < localStorage.length; i++) {
            const oldKey  = keys[i].split(' ');
            if (oldKey[0] === 'list' && +oldKey[1] !== i) {
                const temp = JSON.parse(localStorage.getItem(keys[i]));
                const newKey = `list ${i}`;

                localStorage.removeItem(keys[i]);
                localStorage.setItem(newKey, JSON.stringify(temp));
                list.push(temp);
            } else if (oldKey[0] === 'list') {
                list.push(JSON.parse(localStorage.getItem(keys[i])));
            }
        }

        const favoriteTemplate = _.template(
            `<% _.forEach(list, function (event) { %>
                <div class="favoriteEvent">
                    <div class="favoriteEventTitle"><%= event.eventTitle %></div>
                    <div class="favoriteHost">
                        <img class="favoriteHostPhoto" src="<%= event.photoLink %>" />
                        <div class="favoriteHostName"><%= event.hostName %></div>
                    </div>
                    <div class="favoriteDetail">
                        <div class="favoriteGroupName"><%= event.groupName %></div>
                        <div class="favoriteDate"><%= event.date %></div>
                        <div class="favoriteTime"><%= event.time %></div>
                        <div class="favoriteRsvp">RSVP <%= event.rsvpCount %>/<%= event.rsvpLimit %></div>
                    </div>
                    <div class="deletefavorite"><i class="fas fa-eraser"></i></div>
                </div>
            <% }) %>`);

        const deletefavorite = document.getElementsByClassName('deletefavorite');
        const favoriteList = favoriteTemplate({list: list});

        favoriteCover.innerHTML = favoriteList;
        listCover.classList.add('hide');
        // document.getElementById('searchPage').classList.add('hide');

        for (let i = 0; i < favoriteCover.children.length; i++) {
            (function (idx) {
                deletefavorite[i].addEventListener('click', function () {
                    localStorage.removeItem(`list ${idx}`);
                    favoriteBox('renew');
                });
            })(i);
        }

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

        return;
    }
    
    const originList = JSON.parse(localStorage.originData);
    const list = originList[idx];

    if (e.currentTarget.classList.contains('addfavorite')) {
        localStorage.setItem(`list ${idx}`, JSON.stringify(list));
        e.currentTarget.classList.add('hide');
        removeItem[idx].classList.remove('hide');
        
    } else {
        localStorage.removeItem(`list ${idx}`, JSON.stringify(list));
        e.currentTarget.classList.add('hide');
        addItem[idx].classList.remove('hide');
    }
}
