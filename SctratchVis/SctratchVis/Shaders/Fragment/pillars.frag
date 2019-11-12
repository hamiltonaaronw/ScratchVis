#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)
#define sqrt3	1.73205080757

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uLastFrame;
uniform float uDeltaTime;

uniform vec2 uRes;

uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

float tanc(float x)
{
	return tan(x) / x;
}

vec2 onRep(vec2 p, float i)
{
	vec2 ret = mod(p, i) - i * 0.5;
	return ret;
}

float barDist(vec2 p, float i, float w)
{
	float ret = length(max(abs(onRep(p, i)) - w, 0.0));
	return ret;
}

float tubeDist(vec2 p, float i, float w)
{
	float ret = length(onRep(p, i)) - w;
	return ret;
}

vec3 rot3(vec3 p, float an, vec3 ax)
{
	vec3 a = normalize(ax);
	float s = sin(an);
	float c = cos(an);
	float r = 1.0 - c;
	    mat3 m = mat3(
        a.x * a.x * r + c,
        a.y * a.x * r + a.z * s,
        a.z * a.x * r - a.y * s,
        a.x * a.y * r - a.z * s,
        a.y * a.y * r + c,
        a.z * a.y * r + a.x * s,
        a.x * a.z * r + a.y * s,
        a.y * a.z * r - a.x * s,
        a.z * a.z * r + c
    );

	vec3 ret = m * p;

	return ret;
}

float sceneDist(vec3 p)
{
	float bx = barDist(p.yz, 0.3, 0.1);
	float by = barDist(p.xz, 0.3, 0.01);
	float bz = barDist(p.xy, 0.3, 0.01);

	float tx = tubeDist(p.yz, 0.1, 0.025);
	float ty = tubeDist(p.xz, 0.1, 0.025);
	float tz = tubeDist(p.xy, 0.1, 0.025);

	float ret = max(max(max(min(min(bx, by), bz), -tx), -ty), -tz);

	return ret;
}

vec3 col(vec2 p)
{
	vec3 ret;
	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	float t = smoothstep(0.0, sin(uTime), uLastFrame);
	float fs = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);


	vec3 cPos = vec3(0.0, 0.0, uTime * mod(f, 0.3));
	vec3 cTarget = vec3(1.0, 0.5, uTime * mod(f, 0.3));

	float sz = 2.5 + f + f;
	vec3 rayDir = rot3(normalize(vec3(p / f, sz)), radians(uTime * 10.0), vec3(0.0, 0.0, 1.0));

	float depth = 0.0;
	//vec3 c = vec3(sin(uFreq));
	vec3 c = vec3(0.0);

	vec3 cb = vec3(
		atan(f, sinc(length(p))), 
		pow(f, sinc(uTime / t) / fs) * t,
		sin(fs + sin(sinc(uLastFreq) / tanc(uDeltaTime)))
		);

	for (int i = 0; i < 99; i++)
	{
		vec3 rayPos = cPos + rayDir * depth;
		float dist = sceneDist(rayPos);

		if (dist < 0.00000001)
		{
			c = sin(cb) * (0.2 + float(i) / 100.0);
			c *= tanc(uSpectrum[i * 2]);
			//c /= sqrt3 /(TAU * 2.0);
			//c += c;
			break;
		}

		depth += dist;
	}

	ret = c;
	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes)
	/ min(uRes.x, uRes.y) / (10.0 * sin(uFreq) - cos(uTime));

	vec4 ret;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}