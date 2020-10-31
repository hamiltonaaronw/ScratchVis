#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
//uniform float uDeltaFreq;
uniform float uTime;
//uniform float uLastFrame;
//uniform float uDeltaTime;
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

float lanczosKernel(int ai, float x)
{
	float ret;
	float af = float(ai);

	if (x == 0.0)
		return 1.0;
	if (-af <= x && x < af)
		return (af * sin(PI * x) * sin((PI * x) / af)) / ((PI * PI) * (x * x));
	else
		return 0;
}

float lanczosInterp(int ai, float x)
{
	float ret = 0.0;
	int ub = int(floor(x));
	int lb = int(floor(x)) - ai + 1;

	for (int i = lb; i <= ub; i++)
	{
		ret += uSpectrum[i] * lanczosKernel(ai, x - float(i));
		//ret = mod(abs(ret), 1.0);
	}

	return abs(ret);
}

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

float box(vec3 p, vec3 b)
{
	vec3 d = abs(p) - b;
	return length(max(d, 0.0));
}

float ifsBox(vec3 p)
{
	for (int i = 0; i < 6; i++)
	{
		p = abs(p) - 1.0;
		p.xz *= rot(0.7);
		p.xy *= rot(0.8);
	}

	return box(p, vec3(0.0, 1.0, 0.3));
}

float map(vec3 p)
{
	float c = 8.0;
	p.z = mod(p.z, c) - c * 0.1;
	return ifsBox(p);
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 9.0 - 3.0) -1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

vec3 col2(vec2 p)
{
	vec3 ret;

	float f = (abs(uFreq) + abs(uLastFreq)) * 0.5;
	float ff = fract(f * 100.0);
	float lif = lanczosInterp(2, f);
	float liff = lanczosInterp(2, ff);

	float fd = max(f, lif) / min(f, lif);
	fd = mod(fd * 10.0, 1.0);
	float ffd = max(ff, liff) / min(ff, liff);
	ffd = clamp(fd, min(f, 0.1), mod(fd, 1.0));

	p *= rot(uTime + ffd * f);

	vec3 cPos = vec3(2.5 * sin(0.5 * uTime), 0.5 * cos(1.3 * uTime), -20.0 * uTime);
	vec3 cDir = vec3(0.0, 0.0, -1.0);
	vec3 cUp = vec3(0.0, 1.0, 0.0);
	vec3 cSide = cross(cDir, cUp);

	vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir + ffd);

	float t = 0.0;
	float acc = 0.0;
	for (int i = 0; i < 150; i++)
	{
		vec3 pos = cPos + ray * t * ffd / f + lif;
		float dist = map(pos + lif);

		dist = max(abs(dist), 0.02);
		float a = exp(-dist * 3.0) / (ffd / 0.25);

		if (mod(pos.z - 60.0 * uTime, 50.0) <7.0)
			a *= 5.0;

		acc += a;

		t += dist * 0.5;

		if (t > 100.0)
			break;
	}

	vec3 c = hsv(
		fract(ff),
		0.4 / liff,
		acc * 0.001 + ffd
		);

	ret = uFreq > 0.0 ? c : vec3(0.0);

	return ret;
}

vec4 capsule(vec4 color, vec4 bg, vec4 region, vec2 p)
{
	if (p.x > (region.x - region.z) && p.x < (region.x + region.z) &&
		p.y > (region.y - region.w) && p.y < (region.y + region.w) ||
		distance(p, region.xy - vec2(0.0, region.w)) < region.z ||
		distance(p, region.xy + vec2(0.0, region.w)) < region.z)
		return color;
	return bg;
}

vec4 bar(vec4 color, vec4 bg, vec2 pos, vec2 dim, vec2 p)
{
	return capsule(
		color, bg, 
		vec4(
			pos.x, 
			pos.y + dim.y / 2.0,
			dim.x / 2.0, 
			dim.y / 2.0),
		p);
}

vec2 rotate(vec2 point, vec2 center, float theta)
{
	float s = sin(radians(theta));
	float c = cos(radians(theta));

	point.x -= center.x;
	point.y -= center.y;

	float x = point.x * c - point.y * s;
	float y = point.x * s + point.y * c;

	point.x = x + center.x;
	point.y = y + center.y;

	return point;
}

vec4 rays(vec4 color, vec4 bg, vec2 pos, float rad, float rays, float rayLen, vec2 p)
{
	float inside = (1.0 - rayLen) * rad;
	float outside = rad - inside;
	float circle = TAU * inside;

	for (int i = 0; float(i) < rays; i++)
	{
		float len = outside * ((uFreq * i) / rays) * cos(fract(uSpectrum[i] * 10.0) + mod(i, uFreq));
		bg = bar(color, bg, vec2(pos.x, pos.y + inside),
			vec2(circle / (rays * 2.0), len), rotate(p, pos, 360.0 / rays * float(i + uFreq)));
	}

	return bg;
}

vec3 col(vec2 p)
{
	vec3 ret;

	float aspect = uRes.x / uRes.y;
	vec2 q = gl_FragCoord.xy / uRes.xy - 0.5;
	q.x *= aspect;
	vec4 c = mix(
		vec4(cos(uSpectrum[int(floor(mod(fract(uFreq * 100.0) * 10.0, 256.0)))]), 1.0, 0.8 / uFreq, 1.0),
		vec4(uFreq, 0.3, 0.25, 1.0),
		distance(vec2(aspect/ 2.0, 0.5), q));

	const float RAYS = 256.0;
	float rad = 0.25 + sinc(uFreq + 0.125);
	float rayLen = 0.3;

	c = rays(
		vec4(1.0),
		c,
		vec2(aspect / 2.0, 1.0 / 2.0),
		rad,
		RAYS,
		rayLen,
		q);

	ret = c.xyz;
	//ret = vec3(1.0, 0.0, 0.0);
	//ret = vec3(0.0, 1.0, 0.0);
	//ret = vec3(0.0, 0.0, 1.0);

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	
	ret = vec4(col(uv), 1.0);

	retColor = ret;
}