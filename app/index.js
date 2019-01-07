// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

window.addEventListener('load', function () {
    meetUpAPI();
});

function meetUpAPI (query = "English", radius = 10, location = {lat: 37.555, lng: 126.99}) {
    const address = `https://api.meetup.com/find/upcoming_events?key=175b1e495e751e6470291c431102538&photo-host=public&lon=${location.lng}&page=10&text=${query}&radius=10&lat=${location.lat}`;

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

        }).then(function (result) { //즐겨찾기
            let storage = window.localStorage;

            if (storage.length > 1) { // 즐겨찾기 리스트 있으면 실행
                for (let i = 0; i < storage.length; i++) {
                    let coordinates = storage.getItem(`${i}`); //객체 {lat, lng} 형태로 넣기//배열도 가능 geocoder
                    let marker = new google.maps.marker({
                        position: coordinates,
                        map: map
                    });
                    //marker
                }
            }

            let list = result.data.events;
            
            return list;

        }).then(function(list) { // 호스트
            let hostList = [];

            for (let i = 0; i < list.length; i++) {
                let event = {};
                event.hostName = list[i].id;
                event.urlName = list[i].group.urlname;
                hostList.push(new Promise(function (resolve) {
                    const url = `https://api.meetup.com/${event.urlName}/events/${event.hostName}/hosts?key=175b1e495e751e6470291c431102538&sign=true&photo-host=public`;
                    $.ajax({
                        url: url,
                        dataType: 'jsonp',
                        success: function (result) {
                            let host = result.data[0];
                            let newData = {
                                hostName: host.name,
                                photoLink: host.photo.thumb_link,
                                eventTitle: list[i].name,
                                groupName: list[i].group.name,
                                date: `${list[i].local_date.split('-')[0]}년 ${list[i].local_date.split('-')[1]}월 ${list[i].local_date.split('-')[2]}일`,
                                time: list[i].local_time.slice(0,2) > 12 ? `${(list[i].local_time.slice(0,2) - 12) + list[i].local_time.slice(2)} PM` : `${list[i].local_time} AM`,
                                rsvpLimit: list[i].rsvp_limit || "00",
                                rsvpCount: list[i].yes_rsvp_count || 'Unlimited'
                            };

                            resolve(newData);
                        },

                        error: function(err) {
                            reject(err);
                        }
                    });
                }));
            }

            return Promise.all(hostList);

        }).then(function (list) { // 근처 리스트
            let listTemplate = _.template(
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
                            <div class="rsvp">참석자 <%= event.rsvpCount %>명/<%= event.rsvpLimit %>명</div>
                        </div>
                    </div>
                <% }) %>`);
                
            let eventList = listTemplate({list: list});
            
            $('#listCover').append(eventList);
            
        }).catch(function (err) {
            alert(err);
        });
    })
}

$('.mapTitle').click(function () {
    mapAPI();
});

function mapAPI () {
    debugger;
}

function favourity (ev) {
    let storage = window.localStorage;
}

$('#scrollUp').click(function () {
    window.scroll({
        top: 0,
        behavior: "smooth"
    });
});
