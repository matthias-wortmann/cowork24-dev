import openSpaceImg from './images/open-space.jpg';
import fixDeskImg from './images/fix-desk.jpg';
import privateOfficeImg from './images/private-office.jpg';
import teamOfficeImg from './images/team-office.jpg';
import flexDeskImg from './images/flex-desk.jpg';
import meetingRoomImg from './images/meeting-room.jpg';
import communitySpaceImg from './images/community-space.jpg';
import colivingImg from './images/coliving.jpg';
import loungeImg from './images/lounge.jpg';

/**
 * Maps a category to a background image based on its id and name.
 * Uses regex matching similar to CategoryIcons.js so it works
 * regardless of exact Sharetribe backend IDs.
 */
const imageMap = [
  {
    match: combined => /open.?space/i.test(combined),
    image: openSpaceImg,
  },
  {
    match: combined => /fix.?desk/i.test(combined),
    image: fixDeskImg,
  },
  {
    match: combined =>
      (/privat/i.test(combined) || /\b(büro|office|einzel)\b/i.test(combined)) &&
      !/team|meeting|besprechung|open|community/i.test(combined),
    image: privateOfficeImg,
  },
  {
    match: combined => /team/i.test(combined),
    image: teamOfficeImg,
  },
  {
    match: combined => /hot.?desk/i.test(combined) || /flex/i.test(combined),
    image: flexDeskImg,
  },
  {
    match: combined => /meeting/i.test(combined) || /konferenz/i.test(combined) || /besprechung/i.test(combined),
    image: meetingRoomImg,
  },
  {
    match: combined => /community/i.test(combined) || /coworking/i.test(combined),
    image: communitySpaceImg,
  },
  {
    match: combined => /coliving/i.test(combined) || /wohnen/i.test(combined),
    image: colivingImg,
  },
  {
    match: combined => /lounge/i.test(combined) || /airport/i.test(combined) || /flughafen/i.test(combined),
    image: loungeImg,
  },
];

/**
 * Get the background image for a given category.
 *
 * @param {Object} category - Category object with id and name
 * @returns {string} Image import path (resolved by Webpack)
 */
export const getCategoryImage = category => {
  const id = (category?.id || '').toLowerCase();
  const name = (category?.name || '').toLowerCase();
  const combined = `${id} ${name}`;

  const entry = imageMap.find(e => e.match(combined));
  return entry ? entry.image : openSpaceImg;
};
