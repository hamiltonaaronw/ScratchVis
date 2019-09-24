#version 410

/*
tunnel code derived from shadertoy user @WAHa_06x36
https://www.shadertoy.com/user/WAHa_06x36
code source: https://www.shadertoy.com/view/4dfGDr
*/

#define TAU			6.28318530717958647692
#define ITERATIONS		256
#define PI				3.1415926535897932384626433832795

out vec4 retColor;

in vec3 oColor;
in vec2 oTexCoord;

uniform float uFreq;
uniform float uTime;

uniform vec2 uRes;

uniform float uLastFreq;
uniform float uLastFrame;

uniform float uDeltaFreq;
uniform float uDeltaTime;

uniform float[256] uSpectrum;

uniform sampler2D uTex;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

vec3 palette(float i)
{
	if (i < 4.0)
	{
		if (i < 2.0)
		{
			if (i < 1.0) 
				return vec3(cosc(0.0), sinc(0.0), 0.0);
			else
				return vec3(cosc(1.0), sinc(3.0), 31.0);
		}
		else
		{
			if (i < 3.0)
				return vec3(cosc(1.0), sinc(3.0), 53.0);
			else
				return vec3(cosc(28.0), sinc(2.0), 78.0);
		}
	}
	else if (i < 8.0)
	{
		if (i < 6.0)
		{
			if (i < 5.0)
				return vec3(cosc(80.0), sinc(2.0), 110.0);
			else
				return vec3(cosc(143.0), sinc(3.0), 133.0);
		}
		else
		{
			if (i < 7.0)
				return vec3(cosc(181.0), sinc(3.0), 103.0);
			else 
				return vec3(cosc(229.0), sinc(3.0), 46.0);
		}
	}
	else
	{
		if (i < 10.0)
		{
			if (i < 9.0)
				return vec3(cosc(252.0), sinc(73.0), 31.0);
			else
				return vec3(cosc(253.0), sinc(173.0), 81.0);
		}
		else if (i <12.0)
		{
			if (i < 11.0)
				return vec3(cosc(254.0), sinc(244.0), 139.0);
			else 
				return vec3(cosc(239.0), sinc(254.0), 203.0);
		}
		else
		{
			return vec3(cosc(242.0), sinc(255.0), 236.0);
		}
	}
}

vec4 col(float c)
{
	c *=  12.0;

	vec3 c1 = sin(palette(c)) / 256.0;
	vec3 c2 = (cos(palette(c + 1.0)) / palette(c + 1.0)) / 256.0;

	vec4 ret = vec4(mix(c1 * TAU / uFreq, 
					c2 * sinc(cosc(pow(uTime, uFreq * TAU))), 
					c + floor(c / uFreq)),
				1.0);

	return ret / (TAU / PI);
}

float periodic(float x, float p, float d)
{
	x /= p;
	x = abs(x - floor(x) - 0.5) - d * 0.5;

	return x * p;
}

float pCount(float x, float p)
{
	return floor(x / p);
}

float dist(vec3 pos)
{
	float r = length(pos.xy);
	float a = atan(pos.y, pos.x);

	a += uTime * 0.3 * sin(pCount(r, 3.0) + 1.0) * sin(pCount(pos.z, 1.0) * 13.73);

	return min(max(max(
		periodic(r, 3.0, 0.2),
		periodic(pos.z, 1.0, 0.7 + 0.3 * cos(uTime))),
		periodic(a * r, TAU * 2.0 / 6.0 * r, 0.7 + 0.3 * cos(uTime))),
		0.5);
}

void vr(out vec4 ret, in vec2 fCoord, in vec3 pos, in vec3 dir)
{
	vec3 rayDir = -dir;
	vec3 rayPos = pos;// / 2;

	float a = cos(uTime) * 0.0 * 0.4;
	rayDir = rayDir * mat3(
		cos(a), 0.0, sinc(a),
		0.0, 1.0, 0.0,
		-sin(a), 0.0, cos(a)
	);

	float i = 256.0;
	for (int j = 0; j < 256; j++)
	{
		float d = dist(rayPos);
		rayPos += d * rayDir;// * uFreq;

		if (abs(d) < 0.00001)
		{
			i = float(j) * uSpectrum[j];
			break;
		}
	}

	float c = i / 256.0;

	float m1 = mod(c, uTime / uFreq);
	float m2 =  mod(uTime, pow(c, uFreq));
	ret = col(pow(max(m1, m2) * uFreq, min(m1, m2) / uFreq));
}

void main()
{
	vec2 uv = gl_FragCoord.xy / uRes * oTexCoord;
	vec2 coords = cosc(mod(uTime, max(uFreq, 3.0))) *
		//mod(cosc(uTime), 3.0) *// - mod(uTime, sinc(uFreq) + cosc(uFreq))) * 
		(gl_FragCoord.xy -  uRes) / 
		(mod(uTime, max(uv.y, uRes.x) *
		max(uv.x, uRes.y)) - 
		(pow(uFreq, uDeltaTime)));

	coords += uFreq / (TAU + uDeltaTime * uFreq);
	coords *= PI;

	vec3 rayDir = normalize(vec3(coords, 1.0 + 0.0 * sqrt(coords.x * coords.x + coords.y * coords.y))) * uFreq;
	vec3 rayPos = vec3(0.0, -1.0, uTime * 1.0);

	vr(retColor, gl_FragCoord.xy, rayPos, -rayDir);
}