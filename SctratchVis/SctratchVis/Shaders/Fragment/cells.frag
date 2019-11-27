#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uDeltaTime;

uniform vec2 uRes;

uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	float ret = sin(x) / x;
	return ret;
}

float cosc(float x)
{
	float ret = cos(x) / x;
	return ret;
}


float rand(vec2 v)
{
	float ret = fract(sin(dot(v.xy, vec2(12.9898, 78.233))) * 43758.543);
	return ret;
}

float lDist(float d, float s)
{
	float ret = clamp((abs(d - 0.5) * s) - (2.0 - 1.0), 0.0, 1.0);
	return ret;
}

float sdBox(vec2 p, vec2 b)
{
	vec2 d = abs(p) - b;
	float ret = length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0);
	return ret;
}

vec3 col(vec2 p)
{
	float sz = 50.0;
	float per = 2.0;//mod(2.0 + fract(uFreq * 100.0), 3.0);

	vec2 fCoord = gl_FragCoord.xy;
	vec2 pCoord = floor(fCoord / sz) * sz;

	float f = (abs(uFreq) + abs(uLastFreq)) * 0.5;
	float ff = fract(f * 100.0);

	float t;
	t = uTime * (rand(pCoord) + 0.5) * 0.5;
	//t = sin(uTime + (f * uDeltaFreq)) + sin(length(p + fract(f * 10.0)));
		float ptx = p.x * (sin(t) + uDeltaTime);
	float blend = abs((mod(t, per) / per) - 0.5) * 2.0;

	float r1 = rand(pCoord + floor(t / per)) > f ? 1.0 : 0.0;
	float r2 = rand(pCoord + floor(((t + fract(ff * 10.0)) + per * 0.5) / per)) > ptx ? 1.0 : 0.0;

	float r = mix(r1, r2, smoothstep(0.25, 0.75, blend));

	vec2 mCoord = mod(fCoord, sz) / sz;

	if (r > 0.5)
		mCoord.x = 1.0 - mCoord.x;

	float box = 1.0 - (abs(r - 0.5) * 2.0);

	float b1 = lDist(sdBox(mCoord, vec2(box * 0.5)) + (box * 0.5), sz);
	float b2 = lDist(sdBox(1.0 - mCoord, vec2(box * 0.5)) + (box * 0.5), sz);

	vec3 c = vec3(b1 * b2);

	vec3 bg = vec3(
		0.0
	);

	vec3 ret = mix(c, bg, 0.5);
	ret = c;

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv = (gl_FragCoord.xy / uRes.xy);


	ret = vec4(col(uv), 1.0);
	retColor = ret;
}
