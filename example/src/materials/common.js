export const offsetUVs = `
    vec2 offsetUv(vec2 uv, vec3 movement, float factor) {
        return uv + movement.xy * factor;
    }
`
