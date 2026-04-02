/**
 * Landing page listing highlight rows (Airbnb-style horizontal sections).
 * Rows without categoryMatch/categoryId load all published listings with the given sort.
 * Thematic rows resolve a category from the hosted category tree via categoryMatch or categoryId.
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
        /workation/i.test(id) ||
        /workation/i.test(name) ||
        /work.?ation/i.test(name),
    },
  ],
};

export default landingPage;
