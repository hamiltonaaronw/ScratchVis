#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaTime;
uniform float[256] uSpectrum;
uniform vec2 uRes;

mat2 rot(float a)
{
	float c = cos(a);
	float s = sin(a);

	mat2 ret = mat2(
		c, s,
		-s, c
	);

	return ret;
}

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

float segim(vec2 p, vec2 a, vec2 b, float nz, float id)
{
	vec2 pa = p - a;
	
	vec2 ba = b - a;

	float ss = smoothstep(uFreq, uLastFreq, uDeltaTime);

	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0) + nz * 0.017;
	float vv = sinc(ss * 0.0225) * 0.1;

	float ret = length(pa - uFreq * 0.015 * (h - 1.0) - ba * h) * uFreq * 7.0 * uFreq;
	ret /= ss;

	return ret;
}

float tri(float x)
{
	float ret = abs(fract(x) - 0.5);
	return ret;
}

vec2 tri2(vec2 p)
{
	vec2 ret = vec2(tri(p.x + tri(p.y * 2.0)), tri(p.y + tri(p.x * 2.0)));

	return ret;
}

mat2 m2 = mat2(
	0.970, 0.242,
	-0.242, 0.970
);

float triangleNoise(vec2 p)
{
	float z = 1.5;
	float z2 = 1.5;
	float rz = 0.0;
	
	vec2 bp = p * 0.8;

	float a = smoothstep(uFreq, uLastFreq, uDeltaTime);

	for (float i = 0.0; i < 3.0; i++)
	{
		vec2 dg = tri2(bp * 2.0) * 0.5;
		dg *= rot(a * 4.5);
		p += dg / z2;
		bp *= 1.5;
		z2 *= 0.6;
		z *= 1.7;
		p *= 1.2;
		p *= m2;

		rz += (tri(p.x + tri(p.y)))/ z;
	}

	return rz;
}

vec3 ren(vec2 p)
{
	vec2 p1 = vec2(-1.0, 0.0);
	vec3 col = vec3(0);
	float nz = clamp(triangleNoise(p), 0.0, 1.0);

	float a = smoothstep(uFreq, uLastFreq, uDeltaTime);

	for (int i = 0; i < 100; i++)
	{
		p1 *= rot(0.05 + pow(uTime * 12.25, 1.5) * 0.0007);
		vec2 p2 = p1 * rot(0.04 * float(i) - a * 1.575 - uFreq * 1.5) * uSpectrum[i];
		col += abs(sin(vec3(0.6 + sin(a * 0.05) * 0.4, 1.5, 2.0) + float(i) * 0.011 + uTime * 0.8)) *
				0.0015 / ((pow(segim(p, p1, p2, nz, float(i)), 1.2)));
	}

	col *= uFreq;
	col *= uFreq;
	return col;
}

#define r res;

const float n = 750.0;			// number of lights
const float iRad = 0.014;		// radius of lights
const float oRad = 0.08;		// radius of innermost orbit
const float rotSpeed = 0.01;	// speed of rotation
const float colChange = 0.2;	//	rate of color change
const float avgBright = 0.75;	// average brightness

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float f = min(abs(uFreq), abs(uLastFreq)) + abs((abs(uFreq - uLastFreq)) / 2.0);
	float ff = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);

	vec3 avgLight = vec3(avgBright);
	float amp = (1.0 + ff)- avgBright;

	float t = uTime * 4.0;
	vec3 inner = vec3(
		sin(colChange * t),
		sin(1.1 * colChange * t + 2.0 / 3.0 * PI) / f,
		sin(1.2 * colChange * t + 4.0 / 3.0 * PI)
	) * amp + avgLight;
	vec3 outer = vec3(
		sin(1.1 * (colChange / ff) * t + 2.0 / 3.0 * sinc(PI / ff) + uTime),
		sin(1.2 * (atan(colChange, ff)) * t + 4.0 / 3.0 * PI),
		sin(colChange * t)
	) * amp + avgLight;

	for (float i = 0.0; i < n; i++)
	{
		float j = i + 1.0 + f;
		vec2 q = p + vec2(
			cos(t * j * rotSpeed),
			sin(t * j * rotSpeed)
		) * sqrt(j) * oRad;

		vec3 mixC = mix(inner, outer, (j + ff) / n);

		c += mixC * pow(iRad / ff, 2.0) / pow(length(q), 2.0);
	}

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv = gl_FragCoord.xy / uRes.xy * 2.0 - 2.0;
	uv /= 1.5;

	float a = smoothstep(uFreq, uLastFreq, uDeltaTime);

	//retColor = vec4(ren(uv * 0.25) * a,mod(a, 1.0));
	retColor = vec4(col(uv), 1.0);
}