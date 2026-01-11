// User type for grid test data
export interface User {
  id: number
  name: string
  email: string
  avatar: {
    src: string
  }
  status: 'subscribed' | 'unsubscribed' | 'bounced'
  location: string
}

// Test data with 400 rows for grid performance testing
export const gridTestData: User[] = generateTestData()

function generateTestData(): User[] {
  const firstNames = [
    'Alex',
    'Jordan',
    'Taylor',
    'Morgan',
    'Casey',
    'Jamie',
    'Riley',
    'Kelly',
    'Drew',
    'Avery',
    'Quinn',
    'Reese',
    'Cameron',
    'Dakota',
    'Phoenix',
    'River',
    'Sage',
    'Rowan',
    'Parker',
    'Logan',
    'Skyler',
    'Peyton',
    'Blake',
    'Charlie',
    'Sam',
    'Finley',
    'Emerson',
    'Hayden',
    'Dylan',
    'Kai',
  ]

  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Thompson',
    'White',
    'Harris',
    'Clark',
    'Lewis',
    'Robinson',
    'Walker',
    'Hall',
    'Allen',
    'Young',
    'King',
    'Wright',
    'Scott',
    'Green',
    'Baker',
    'Adams',
    'Nelson',
    'Carter',
    'Mitchell',
  ]

  const cities = [
    'New York, USA',
    'London, UK',
    'Paris, France',
    'Berlin, Germany',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Toronto, Canada',
    'Dubai, UAE',
    'Singapore',
    'Hong Kong',
    'Shanghai, China',
    'Mumbai, India',
    'São Paulo, Brazil',
    'Mexico City, Mexico',
    'Seoul, South Korea',
    'Amsterdam, Netherlands',
    'Stockholm, Sweden',
    'Oslo, Norway',
    'Copenhagen, Denmark',
    'Vienna, Austria',
    'Rome, Italy',
    'Madrid, Spain',
    'Barcelona, Spain',
    'Lisbon, Portugal',
    'Athens, Greece',
    'Istanbul, Turkey',
    'Moscow, Russia',
    'Warsaw, Poland',
    'Prague, Czech Republic',
    'Budapest, Hungary',
    'Dublin, Ireland',
    'Brussels, Belgium',
    'Zurich, Switzerland',
    'Helsinki, Finland',
    'Bangkok, Thailand',
    'Jakarta, Indonesia',
    'Manila, Philippines',
    'Kuala Lumpur, Malaysia',
    'Auckland, New Zealand',
    'Vancouver, Canada',
    'Los Angeles, USA',
    'Chicago, USA',
    'San Francisco, USA',
    'Seattle, USA',
    'Boston, USA',
    'Miami, USA',
    'Denver, USA',
    'Austin, USA',
    'Portland, USA',
    'Atlanta, USA',
  ]

  const data: User[] = []

  for (let i = 1; i <= 400; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)] ?? 'Alex'
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)] ?? 'Smith'
    const name = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`
    const city = cities[Math.floor(Math.random() * cities.length)] ?? 'New York, USA'

    // Weight the status distribution: 60% subscribed, 30% unsubscribed, 10% bounced
    let status: 'subscribed' | 'unsubscribed' | 'bounced'
    const rand = Math.random()
    if (rand < 0.6) {
      status = 'subscribed'
    } else if (rand < 0.9) {
      status = 'unsubscribed'
    } else {
      status = 'bounced'
    }

    data.push({
      id: i,
      name,
      email,
      avatar: {
        src: `https://i.pravatar.cc/128?u=${i}`,
      },
      status,
      location: city,
    })
  }

  return data
}
