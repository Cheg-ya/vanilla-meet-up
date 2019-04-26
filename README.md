# Vanilla Meetup

## Introduce
**Vanilla Meetup**은 Plain Javascript, oogle Map, Meet Up API를 이용해 만든 위치 기반 Meetup List를 제공하는 어플리케이션입니다.
<br>
<p align="center"> 
  <img src="vanilla-meet-up.gif">
</p>

## Setup

Install dependencies

```sh
# npm install
```

## Development

```sh
# npm run dev
# visit http://localhost:8080
```

## Features
- Look Up 메뉴 클릭 후 폼에 지역과 토픽 키워드, 거리 반경(마일)을 입력하면 조건에 맞는 Meetup List를 볼 수 있습니다.
- Map Up 메뉴 클릭 시 등장하는 지도에 사용자가 원하는 지역을 클릭하여 선택할 수 있습니다.
- [Meetup Upcoming Events API]를 이용하여 사용자가 선택한 지역의 Meetup List를 10개만 불러옵니다.
- Meetup List에서 아래와 같은 정보를 확인 할 수 있습니다.
  - [ ] 이벤트 이름
  - [ ] Meetup Group 이름
  - [ ] 이벤트 날짜 및 시간
  - [ ] RSVP 인원
  - [ ] 이벤트 호스트의 이름과 사진
- Meetup List에는 즐겨찾기 기능이 있습니다.
  - [ ] Pick Up 메뉴에서 사용자가 추가한 Meetup을 즐겨찾기 리스트를 볼 수 있습니다.
  - [ ] 사용자는 원하는 Meetup을 즐겨찾기에 추가 및 제거할 수 있습니다.
  - [ ] 즐겨찾기 목록은 LocalStorage에 저장되어 언제든 불러올 수 있습니다.

## Tech
- Plain Javascript
- CSS
- HTML
- Webpack
