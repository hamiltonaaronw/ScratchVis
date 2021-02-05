#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uTime;
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

mat2 rot(float a)
{
	return mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);
}

vec3 hsv2rgb(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

float scale;

float map(vec3 p, float f)
{
	float x = length(normalize(vec3(0.1, f, 1.0)));
	p.z -= uTime * (-5.0 - x);//(-5.0 - sinc(uTime / (abs(uFreq - uLastFreq) * 2.5)));
	p.xy *= rot(uTime * 0.3 + p.z * 0.5);
	p.xy = abs(p.xy) - x;
	p.xy += sin(uTime + p.z);// * mod(x, 0.4);
	if (p.x < p.y)
		p.xy = p.yx;

	p.z = mod(p.z, 8.0) - 4.0;

	p.x -= (2.0 + x) + sinc(uTime + p.z * 0.4 + p.y * 0.6) * 0.5 + sinc(x);
	p = abs(p);
	float s = 2.0;
	vec3 offset = p - abs(0.275 - x) * x;
	
	for (float i = 0.0; i < 6.0; i++)
	{
		p = 1.0 - abs(p);
		float r = -7.85 * clamp(0.3 * max(1.4 / dot(p, p), 1.0), 0.0, 1.0 + (f + f));
		s *= r;
		p *= r;
		p += offset;
		p.yz *= rot(uTime * r / f);
		offset /= (2.2 + f);
	}

	s = abs(s);
	scale = s;
	float a = 100.0 * x;
	p -= clamp(p, -a, a) / x;
	return length(p) / s;
}

float fNorm(float x)
{
	if (x < 1.0 && x > 0.01)
		return x;
	while (x > 1.0 && x < 0.01)
	{
		if (x > 1.0)
			x /= 10.0;
		else if (x < 0.01)
			x *= 10.0;
	}
	return x;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c;

	p *= rot(uTime);

	float f = mod(fract(uFreq * 100.0), fract(uFreq * 10.0));
	float maxF = max(f, uFreq);
	float minF = min(f, uFreq);
	float ff = mod(
		fract(abs(uFreq - uLastFreq) * 10.0), f
	);

	ff = fNorm(f);

	vec3 rd = normalize(vec3(p, 1.0));
	vec3 q = vec3(0.0, 0.0, -3.0);

	for (int i = 1; i < 100; i++)
	{
		float d = map(q, ff) * 0.75;
		q += rd * d;
		if (d < 0.001)
		{
			c = mix(vec3(1.0), cos(vec3(1.0, 18.0, 3.0) + log2(scale * scale * scale)) * 0.5 + 0.5, 0.5) * 12.5 / float(i);
			break;
		}
	}

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv;
	
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}
