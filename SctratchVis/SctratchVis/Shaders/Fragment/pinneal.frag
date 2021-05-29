#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
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

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

vec2 pmod(vec2 p, float r)
{
	float a = atan(p.x, p.y) + PI / r;
	float n = TAU / r;
	a = floor(a / n) * n;

	return p * rot(-a);
}

float box(vec3 p, vec3 b)
{
	vec3 d = abs(p) - b;
	float x = 0.0;
	// x += (uFreq + uLastFreq);
	return min(max(d.x, max(d.y, d.z)), x) + length(max(d, 0.0));
}

float ifsBox(vec3 p)
{
	int max;

	max = 5;
	//max += int(floor(fract(uFreq * 100.0)));

	float xx;
	//xx = lenth(p.xz) * 0.3;
	xx = 0.3;
	float yy;
	yy = length(p.yy) * 0.45;
	yy *= 0.1;

	//max = 5;

	for (int i = 0; i < max; i++)
	{
		p = abs(p) - 1.0;
		p.xy *= rot(uTime * xx);
		p.xz *= rot(uTime * yy);
	}
	p.xz *= rot(uTime);

	return box(p, vec3(0.4, 0.8, 0.3));
}

float map(vec3 p, vec3 cPos)
{
	vec3 p1 = p;

	p1.x = mod(p1.x - 5.0, 10.0) - 5.0;
	p1.y = mod(p1.y - 5.0, 10.0) - 5.0;
	p1.z = mod(p1.z, 16.0) - 8.0;
	p1.xy = pmod(p1.xy, 5.0);

	float x;
	//x = 0.5;
	x = mod(uFreq,length(p.yz));

	return ifsBox(p1 + sin(atan(uFreq)) * x);
}

vec3 hsv(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float f = min(abs(uFreq), abs(uLastFreq)) + abs((abs(uFreq - uLastFreq)) / 2.0);
	float ff = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);

	p *= sin(uTime - (log(uFreq)) * (1.0 + mod(uFreq, 0.5))) + ff;
	p /= 5.0;

	vec3 cPos = vec3(0.0, 0.0, -3.0 * uTime);
	vec3 cDir = normalize(vec3(0.0, 0.0, 1.0));
	vec3 cUp = vec3(sin(uTime), 1.0, 0.0);
	vec3 cSide = cross(cDir, cUp);

	p.yx *= rot(uTime);
	p.xy *= -rot(uTime);

	vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir);

	// phantom mode
	float acc = 0.0;
	float acc2 = 0.0;
	float t = 0.0;
	for (int i = 0; i < 99; i++)
	{
		vec3 q = cPos + ray * t;
		float dist = map(q, cPos);
		dist = max(abs(dist), 0.02);
		float a = exp(-dist * 3.0);
		if (mod(length(q) + 24.0 * uTime + f + ff, 30.0 - uFreq) < 3.0)
		{
			a *= 2.0;
			acc2 += a;
		}
		acc += a;
		t += dist * 0.5;
	}

	float r = acc * 0.01 + f;// + ((uRes.y + uRes.x) * 0.025); 
	float g = acc * 0.011 + acc2 * 0.002 / f;// * (uRes.x * 0.0025);
	float b = acc * 0.012 + acc2 * 0.005 / mod(max(r, g), min(r, g));

	r *= mod(f, sin(uTime) + ff);// * 0.5;
	//g *= log(f * atan(r) * log(uTime));
	b += g;

	r *= atan(f, log(f) - b);
	g *= sin(r) * length(vec2(r, f));
	g *= 0.5;
	b -= length(vec3(r / g, g / r, log(f) * f));
	b *= 0.5;
	b *= 0.5;

	c = vec3(r, g, b) * 0.5;
	vec3 h = hsv(r, g, b);
	h *= 0.5;
	h *= 0.5;
	c += h;
	c *= 0.43;


	ret = uFreq > 0.00018 ?  c : vec3(0.0);
	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv = gl_FragCoord.xy / uRes.xy * 2.0 - 2.0;
	uv /= 1.5;


	//float h = hue(uv);
	//ret = vec4(hueRGB(h), 1.0);
	ret = vec4(col(uv), 1.0);

	retColor = ret;
}