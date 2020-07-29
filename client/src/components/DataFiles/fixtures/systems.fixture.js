// Response from SystemsListingView

const systemsFixture = {
  private: 'frontera.home.username',
  community: 'frontera.home.community',
  public: 'frontera.home.public',
  systemsList: [
    {
        'name': 'My Data',
        'system': 'frontera.home.username',
        'scheme': 'private',
        'api': 'tapis',
    },
    {
        'name': 'Community Data',
        'system': 'frontera.home.community',
        'scheme': 'community',
        'api': 'tapis'
    },
    {
        'name': 'Public Data',
        'system': 'frontera.home.public',
        'scheme': 'public',
        'api': 'tapis'
    }
  ]
}

export default systemsFixture;