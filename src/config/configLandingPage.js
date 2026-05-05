/**
 * Landing page listing highlight rows (Airbnb-style horizontal sections).
 * Rows without categoryMatch/categoryId/listingType load all published listings with the given sort.
 * Filter resolution per row:
 *  - listingType: string | string[] — pins pub_listingType (e.g. 'day-pass').
 *  - categoryMatch / categoryId: resolves a category path from the hosted category tree.
 * listingType and category filters can be combined.
 */
const landingPage = {
  listingRows: [
    {
      id: 'newest',
      titleTranslationKey: 'SectionLandingListingRows.rowNewestTitle',
      sort: 'createdAt',
      perPage: 10,
    },
    {
      id: 'coliving',
      titleTranslationKey: 'SectionLandingListingRows.rowColivingTitle',
      sort: 'createdAt',
      perPage: 10,
      categoryMatch: (id, name) =>
        /coliving/i.test(id) || /coliving/i.test(name) || /wohnen/i.test(name),
    },
    {
      id: 'workation',
      titleTranslationKey: 'SectionLandingListingRows.rowWorkationTitle',
      sort: 'createdAt',
      perPage: 10,
      categoryMatch: (id, name) =>
        /workation/i.test(id) || /workation/i.test(name) || /work.?ation/i.test(name),
    },
    {
      id: 'hourly-rental',
      titleTranslationKey: 'SectionLandingListingRows.rowHourlyRentalTitle',
      sort: 'createdAt',
      perPage: 10,
      categoryMatch: (id, name) =>
        /hourly|stunde|hour/i.test(id) || /hourly|stunde|hour/i.test(name),
    },
    {
      id: 'tagespass',
      titleTranslationKey: 'SectionLandingListingRows.rowTagespassTitle',
      sort: 'createdAt',
      perPage: 10,
      // Filter by listingType, not category — Tagespass / day-pass is a Sharetribe listingType.
      listingType: 'tagespass',
    },
    {
      id: 'fixdesk',
      titleTranslationKey: 'SectionLandingListingRows.rowFixdeskTitle',
      sort: 'createdAt',
      perPage: 10,
      categoryMatch: (id, name) => /fix.?desk/i.test(id) || /fix.?desk/i.test(name),
    },
    {
      id: 'individual',
      titleTranslationKey: 'SectionLandingListingRows.rowIndividualTitle',
      sort: 'createdAt',
      perPage: 10,
      categoryMatch: (id, name) =>
        /privat|private|individual/i.test(id) &&
        /privat|private|individual/i.test(name) &&
        !/team/i.test(name),
    },
    {
      id: 'lounge',
      titleTranslationKey: 'SectionLandingListingRows.rowLoungeTitle',
      sort: 'createdAt',
      perPage: 10,
      categoryMatch: (id, name) =>
        /lounge|airport|flughafen/i.test(id) || /lounge|airport|flughafen/i.test(name),
    },
  ],
};

export default landingPage;
