import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'

// ─── Coral zone: right side (+X), in front of the scene ──────────
const ZONE = { xMin: 5, xMax: 22, zMin: -20, zMax: 5, floor: -25 }

// Warm coral palette
const PALETTE = ['#ff6622', '#ff3355', '#ff8844', '#cc44dd', '#ff4499', '#ff7700', '#ee2266', '#ff9922']

const BRANCH_COUNT = 90
const HEAD_COUNT   = 45
const FAN_COUNT    = 20

export function Corals() {
  const branchRef = useRef<THREE.InstancedMesh>(null!)
  const headRef   = useRef<THREE.InstancedMesh>(null!)
  const fanRef    = useRef<THREE.InstancedMesh>(null!)

  const { branchGeo, headGeo, fanGeo } = useMemo(() => ({
    branchGeo: new THREE.CylinderGeometry(1, 1.2, 1, 6),
    headGeo:   new THREE.SphereGeometry(1, 8, 6),
    fanGeo:    new THREE.PlaneGeometry(1, 1, 2, 4),
  }), [])

  useEffect(() => {
    const mat   = new THREE.Matrix4()
    const quat  = new THREE.Quaternion()
    const color = new THREE.Color()

    const rx = () => ZONE.xMin + Math.random() * (ZONE.xMax - ZONE.xMin)
    const rz = () => ZONE.zMin + Math.random() * (ZONE.zMax - ZONE.zMin)
    const rc = (off = 0) => PALETTE[(Math.floor(Math.random() * PALETTE.length) + off) % PALETTE.length]

    // ── Branch corals ─────────────────────────────────────────
    for (let i = 0; i < BRANCH_COUNT; i++) {
      const x = rx(), z = rz()
      const h = 1.2 + Math.random() * 5.5
      const r = 0.04 + Math.random() * 0.14
      quat.setFromEuler(new THREE.Euler(
        (Math.random() - 0.5) * 0.25, 0, (Math.random() - 0.5) * 0.25
      ))
      mat.compose(
        new THREE.Vector3(x, ZONE.floor + h / 2, z),
        quat,
        new THREE.Vector3(r, h, r)
      )
      branchRef.current.setMatrixAt(i, mat)
      color.set(rc(i))
      branchRef.current.setColorAt(i, color)
    }
    branchRef.current.instanceMatrix.needsUpdate = true
    if (branchRef.current.instanceColor) branchRef.current.instanceColor.needsUpdate = true

    // ── Boulder coral heads ───────────────────────────────────
    for (let i = 0; i < HEAD_COUNT; i++) {
      const x = rx(), z = rz()
      const r = 0.35 + Math.random() * 1.0
      mat.compose(
        new THREE.Vector3(x, ZONE.floor + r * 0.7, z),
        new THREE.Quaternion(),
        new THREE.Vector3(r, r * 0.55, r)
      )
      headRef.current.setMatrixAt(i, mat)
      color.set(rc(i + 3))
      headRef.current.setColorAt(i, color)
    }
    headRef.current.instanceMatrix.needsUpdate = true
    if (headRef.current.instanceColor) headRef.current.instanceColor.needsUpdate = true

    // ── Fan corals (flat planes) ──────────────────────────────
    for (let i = 0; i < FAN_COUNT; i++) {
      const x = rx(), z = rz()
      const h = 1.5 + Math.random() * 3.0
      quat.setFromEuler(new THREE.Euler(0, Math.random() * Math.PI, 0))
      mat.compose(
        new THREE.Vector3(x, ZONE.floor + h / 2, z),
        quat,
        new THREE.Vector3(h * 0.9, h, 1)
      )
      fanRef.current.setMatrixAt(i, mat)
      color.set(rc(i + 1))
      fanRef.current.setColorAt(i, color)
    }
    fanRef.current.instanceMatrix.needsUpdate = true
    if (fanRef.current.instanceColor) fanRef.current.instanceColor.needsUpdate = true
  }, [])

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.78,
    metalness: 0.05,
    vertexColors: true,
  }), [])

  const fanMat = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.85,
    metalness: 0.0,
    vertexColors: true,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  }), [])

  return (
    <>
      <instancedMesh ref={branchRef} args={[branchGeo, mat, BRANCH_COUNT]} />
      <instancedMesh ref={headRef}   args={[headGeo,   mat, HEAD_COUNT]}   />
      <instancedMesh ref={fanRef}    args={[fanGeo, fanMat, FAN_COUNT]}    />
    </>
  )
}
