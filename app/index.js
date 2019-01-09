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
const addList = document.getElementsByClassName('addPickUp');
const removeList = document.getElementsByClassName('removePickUp');
const reloader = document.getElementById('pageReload');
const form = document.getElementsByClassName('popUp')[0];
const mapCover = document.getElementsByClassName('mapCover')[0];
const lookUp = document.getElementById('lookUpButton');
const mapUp = document.getElementById('mapUpButton');
const pickUp = document.getElementById('pickUpButton');
const meetUplist = document.getElementsByClassName('event');
const autocomplete = new google.maps.places.Autocomplete(city);

let previousCity = '';
let mapclicked = false;
let submitted = false;
let pickUpClicked = false;

lookUp.addEventListener('click', () => {
    const listed = listCover.classList.contains('listMapUp');
    const hidden = listCover.classList.contains('hide');

    if (listed && !hidden) {
        listCover.classList.toggle('hide');
        listCover.classList.remove('listMapUp');
        mapCover.classList.remove('mapCover-clicked');

    } else if (listed && hidden) {
        listCover.classList.remove('listMapUp');
    }
});

mapUp.addEventListener('click', () => {
    const listed = listCover.classList.contains('listLookUp');
    const hidden = listCover.classList.contains('hide');

    if (listed && !hidden) {
        listCover.classList.toggle('hide');
        listCover.classList.remove('listLookUp');
        form.classList.remove('popUp-clicked');
    }
});

pickUp.addEventListener('click', (e) => {
    pickUpClicked = true;

    pickUpBox({
        target: e.currentTarget.id
    });
});

reloader.addEventListener('click', () => {
    location.reload();
});

google.maps.event.addListener(map,'click', (e) => {
    mapclicked = true;

    if (!mapCover.classList.contains('mapCover-clicked')) {
        mapCover.classList.add('mapCover-clicked');
    }

    if (topic.value.length === 0) {
        topic.value = 'movie';
    }

    if (radius.value.length === 0) {
        radius.value = 10;
    }

    if (city.value.length === 0) {
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

submit.addEventListener('click', () => {
    submitted = true;
    form.classList.add('popUp-clicked');

    const geocoder = new google.maps.Geocoder();

    targetCoordinates(geocoder);
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

    return new Promise((resolve, reject) => {
        $.ajax({
            url: address,
            dataType: 'jsonp',
            success (data) {
                resolve(data);
            },

            error (err) {
                reject(err);
            }

        }).then((list) => {
            if (list.data.errors !== undefined) {
                loader.classList.add('hide');
                throw list.data.errors[0].message;
            }

            if (list.data.events.length === 0) {
                loader.classList.add('hide');

                if (mapclicked) {
                    mapCover.classList.remove('mapCover-clicked');
                }

                if (submitted) {
                    form.classList.remove('popUp-clicked');
                }
                
                throw 'No available event';
            }

            const hostList = [];

            list = list.data.events;

            for (let i = 0; i < list.length; i++) {
                hostList.push(new Promise((resolve) => {
                    const url = `https://api.meetup.com/${list[i].group.urlname}?key=175b1e495e751e6470291c431102538&photosign=true&photo-host=public`;

                    $.ajax({
                        url: url,
                        dataType: 'jsonp',
                        success (result) {
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

                        error (err) {
                            reject(err);
                        }
                    });
                }));
            }

            return Promise.all(hostList);

        }).then((list) => {
            localStorage.setItem('originData', JSON.stringify(list));

            listTemplate(list);

            if (submitted) {
                listCover.classList.remove('mapLookUp');
                listCover.classList.add('listLookUp');     
                submitted = false;

            } else if (mapclicked) {
                listCover.classList.remove('listLookUp');
                listCover.classList.add('listMapUp');
                mapclicked = false;
            }

        }).catch((err) => {
            alert(err);
        });
    });
}

function targetCoordinates (geocoder) {
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

    geocoder.geocode({'address': currentCity}, (results, status) => {
        location = results[0].geometry.location;

        if (status === 'OK') {
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

function createMarker (list, info) {
    for (let i = 0; i < list.length; i++) {
        const place = {
            lat: list[i].lat,
            lng: list[i].lng
        };

        const marker = new google.maps.Marker({
            position: place,
            map:map,
            animation: google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
            info.open(map, marker);
        });

        markers.push(marker);
    }
}

function clearMarker() {
    markers.forEach((marker) => {
        marker.setMap(null);
    });

    markers = [];
}

function pickUpBox (e) {
    if (e.target === 'pickUpButton') {
        const list = [];

        if (localStorage.originData === undefined || localStorage.length <= 2) {
            alert('Your pick up list is empty!')
            const formlisted = listCover.classList.contains('listLookUp');

            if (formlisted) {
                listCover.classList.toggle('hide');
                listCover.classList.remove('listLookUp');
                form.classList.remove('popUp-clicked');
            }

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

        const maplisted = listCover.classList.contains('listMapUp');
        const formlisted = listCover.classList.contains('listLookUp');
    
        if (maplisted) {
            listCover.classList.remove('listMapUp');
            mapCover.classList.remove('mapCover-clicked');
    
        } else if (formlisted) {
            listCover.classList.remove('listLookUp');
            form.classList.remove('popUp-clicked');
        }

        listCover.classList.add('listMapUp');
        mapCover.classList.add('mapCover-clicked');
        pickUpClicked = false;

        return;
    }
}

function dataStore (e) {
    let lists = [];
    const idx = Array.prototype.slice.call(listCover.children).indexOf(e.target.offsetParent);

    if (e.listType === 'pickUp') {
        for (let k in localStorage) {
            let id = k.split(' ')[0];

            if (id === 'id') {
                lists.push(JSON.parse(localStorage[k]));
            }
        }

    } else if (e.listType === 'list') {
       lists = JSON.parse(localStorage.originData);
    }

    const singleList = lists[idx];

    if (e.action === 'add') {
        localStorage.setItem(`id ${singleList.eventId}`, JSON.stringify(singleList));
        addList[idx].classList.add('hide');
        removeList[idx].classList.remove('hide');

    } else if (e.action === 'remove') {
        localStorage.removeItem(`id ${singleList.eventId}`, JSON.stringify(singleList));

        if (e.listType === 'pickUp') {
            listCover.removeChild(e.target.offsetParent);

            if (listCover.children.length === 0) {
                listCover.classList.add('hide');
                mapCover.classList.remove('mapCover-clicked');
            }

            return;
        }

        removeList[idx].classList.add('hide');
        addList[idx].classList.remove('hide');

    } else {
        throw new Error('Unvaild input value');
    }
}

function listTemplate (list) {
    if (!Array.isArray(list)) {
        throw new Error('List is not an Array');
    }

    const listTemplate = _.template(
        `<% _.forEach(list, (event) => { %>
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

    clearMarker();

    const infoTemplate = _.template(
        `<div class="info">
            <div class="host">
                <img class="hostPhoto" src="<%= list.photoLink %>" />
                <span class="hostName"><%= list.hostName %></span>
            </div>
            <div class="detail">
                <div class="eventTitle"><%= list.eventTitle %></div>
                    <div class="groupName">Group: <%= list.groupName %></div>
                    <div class="date">Date: <%= list.time %> <%= list.date %></div>
                    <div class="rsvp">RSVP: <%= list.rsvpCount %>/<%= list.rsvpLimit %></div>
                </div>
            </div>
        </div>`);

    for (let i = 0; i < list.length; i++) {
        const contentString = infoTemplate({list: list[i]});
        const infoWindow = new google.maps.InfoWindow({
            content: contentString
        });

        createMarker([list[i]], infoWindow);
    }

    if (pickUpClicked) {
        for (let i = 0; i < listCover.children.length; i++) {
            removeList[i].addEventListener('click', (e) => {
                dataStore({
                    listType: 'pickUp',
                    action: 'remove',
                    target: e.currentTarget
                });
            });

            addList[i].classList.add('hide');
            removeList[i].classList.remove('hide');
            meetUplist[i].addEventListener('mouseover', () => {
                map.setCenter({
                    lat: list[i].lat,
                    lng: list[i].lng
                });

                map.getCenter();
            });
        }

        pickUpClicked = false;

    } else {
        for (let i = 0; i < listCover.children.length; i++) {
            addList[i].addEventListener('click', (e) => {
                dataStore({
                    listType: 'list',
                    action: 'add',
                    target: e.currentTarget
                });
            });

            removeList[i].addEventListener('click', (e) => {
                dataStore({
                    listType: 'list',
                    action: 'remove',
                    target: e.currentTarget
                });
            });

            meetUplist[i].addEventListener('mouseover', () => {
                map.setCenter({
                    lat: list[i].lat,
                    lng: list[i].lng
                });

                map.getCenter();
            });
        }
    }

    loader.classList.add('hide');
    listCover.classList.remove('hide');
}
