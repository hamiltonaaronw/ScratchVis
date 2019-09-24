#version 450 core

#define PI	3.1415926535897932384626433832795
#define TAU	(2.0 * PI)

out vec4 retColor;

in vec3 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float[256] uSpectrum;

uniform float uTime;
uniform float uLastFrame;
uniform float uDeltaTime;

uniform sampler2D uTex;
uniform vec2 uRes;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

float radial(vec2 p, float r)
{
	float ret = length(p) - r;
	ret = fract(ret * 1.0);
	float ret2 = 1.0 - ret;
	ret *= ret2;
	ret = pow((ret * 5.5), 10.0);

	return ret;
}

vec4 T (vec3 u)
{
	return texture(uTex, u / uRes.xy);
}

void main()
{
	vec2 r = uRes.xy.
	vec2 uv = gl_FragCoord.xy / uRes.xy;

	vec4 c = texture(uTex, uv / r);

	retColor = vec4(1.0, 0.0, 0.0, 1.0);
}

/*
void main()
{
	vec2 uv = gl_FragCoord.xy / uRes.xy;

	vec2 cUV = uv * sinc(2.0 * uFreq) + 1.0;
	vec2 oUV = uv * 0.00080;
	float r  = (uv.x * uv.x + uv.y * uv.y);
	float g = radial(cUV + mod(uFreq + uv.y, uLastFreq + uv.x), pow(mod(uFreq * 10, TAU), r * uTime));
	vec2 fUV = mix(uv, oUV, sinc(g));
	
	vec3 bg = vec3(0.0);

	vec3 col = mix(bg - uFreq, vec3(fUV - uFreq, mod(uFreq + uLastFreq, TAU)), uFreq + PI);

	retColor = vec4(col, 1.0);
}
*/

/*
void main()
{
	vec2 cPos = -1.0 + 2.0 * gl_FragCoord.xy / uRes.xy;
	float cLen = length(cPos);

	vec2 uv = gl_FragCoord.xy / uRes.xy + (cPos / cLen) * cos(cLen * 12.0 - uTime * 4.0) * 0.03;

	vec3 col = texture2D(uTex, uv).xyz;

	retColor = vec4(mix(col, vec3(0.5, 0.5, 0.5), uFreq), 1.0);
}
*/