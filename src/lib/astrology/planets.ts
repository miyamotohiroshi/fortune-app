import {
  Body,
  GeoVector,
  Ecliptic,
  SunPosition,
  SiderealTime,
} from 'astronomy-engine'
import type { PlanetKey } from './constants'
import type { CityCoords } from './cities'

export type PlanetPositions = Record<PlanetKey, number>

const DEG = Math.PI / 180

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function eclipticLon(body: Body, date: Date): number {
  const vec = GeoVector(body, date, true)
  return norm360(Ecliptic(vec).elon)
}

function calcASCMC(date: Date, coords: CityCoords): { asc: number; mc: number } {
  const gast = SiderealTime(date)
  const lst = ((gast + coords.lon / 15) % 24 + 24) % 24
  const ramc = lst * 15 // degrees

  const ramcRad = ramc * DEG
  const latRad = coords.lat * DEG
  const eps = 23.4392911 // mean obliquity degrees (J2000 approx)
  const epsRad = eps * DEG

  const mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(epsRad))
  const mc = norm360(mcRad / DEG)

  const ascRad = Math.atan2(
    -Math.cos(ramcRad),
    Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad)
  )
  const asc = norm360(ascRad / DEG)

  return { asc, mc }
}

export function calculatePlanetPositions(
  birthDate: Date,
  birthTime: string | null,
  cityCoords: CityCoords | null
): PlanetPositions {
  let date: Date
  if (birthTime) {
    const [h, m] = birthTime.split(':').map(Number)
    date = new Date(Date.UTC(
      birthDate.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
      h, m, 0
    ))
    // Subtract timezone offset: birthTime is local, convert to UTC
    // (We store birthTime as local clock time; city gives offset)
    if (cityCoords) {
      const offsetMinutes = Math.round(cityCoords.lon / 15 * 60)
      date = new Date(date.getTime() - offsetMinutes * 60000)
    }
  } else {
    // No birth time: use noon local time (most common fallback)
    date = new Date(Date.UTC(
      birthDate.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
      12, 0, 0
    ))
    if (cityCoords) {
      const offsetMinutes = Math.round(cityCoords.lon / 15 * 60)
      date = new Date(date.getTime() - offsetMinutes * 60000)
    }
  }

  const sun = norm360(SunPosition(date).elon)
  const moon = eclipticLon(Body.Moon, date)
  const mercury = eclipticLon(Body.Mercury, date)
  const venus = eclipticLon(Body.Venus, date)
  const mars = eclipticLon(Body.Mars, date)
  const jupiter = eclipticLon(Body.Jupiter, date)
  const saturn = eclipticLon(Body.Saturn, date)
  const uranus = eclipticLon(Body.Uranus, date)
  const neptune = eclipticLon(Body.Neptune, date)
  const pluto = eclipticLon(Body.Pluto, date)

  let asc = 0
  let mc = 0
  if (birthTime && cityCoords) {
    const result = calcASCMC(date, cityCoords)
    asc = result.asc
    mc = result.mc
  }

  return { sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto, asc, mc }
}
