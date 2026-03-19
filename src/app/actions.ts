'use server'

import { prisma } from "@/lib/prisma"
import { serializeForClient } from "@/lib/serialize-for-client"

export async function getPackages() {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true, price: { gt: 0 } },
      include: {
         category: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return serializeForClient(packages)
  } catch (error) {
    console.error('Error fetching packages:', error)
    return []
  }
}

export async function getPackageById(id: string) {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        category: true,
        tests: true,
      }
    })
    return pkg ? serializeForClient(pkg) : null
  } catch (error) {
    console.error(`Error fetching package ${id}:`, error)
    return null
  }
}

export async function getPackageBySlug(slug: string) {
  try {
    const pkg = await prisma.package.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        tests: true,
      }
    })
    return pkg ? serializeForClient(pkg) : null
  } catch (error) {
    console.error(`Error fetching package ${slug}:`, error)
    return null
  }
}

export async function getSimilarPackages(currentId: string, categoryId: string) {
  try {
    const packages = await prisma.package.findMany({
      where: {
        categoryId,
        id: { not: currentId },
        isActive: true
      },
      take: 3,
      orderBy: {
        createdAt: 'desc'
      }
    })
    return serializeForClient(packages)
  } catch (error) {
    console.error('Error fetching similar packages:', error)
    return []
  }
}
